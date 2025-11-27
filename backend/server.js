import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieSession from 'cookie-session';
import { google } from 'googleapis';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import DiffMatchPatch from 'diff-match-patch';

const app = express();

// --- Utilities ---
function isValidDriveId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{10,}$/.test(id);
}
function sanitizeFileName(name) {
  if (typeof name !== 'string') return 'document';
  // Replace anything not alnum, dash, underscore, dot, or space
  let safe = name.replace(/[^\w.\- ]+/g, '_').trim();
  if (!safe) safe = 'document';
  // Cap length to avoid overly long headers
  if (safe.length > 120) {
    const extIndex = safe.lastIndexOf('.');
    if (extIndex > 0) {
      const base = safe.slice(0, extIndex).slice(0, 100);
      const ext = safe.slice(extIndex);
      safe = `${base}${ext}`;
    } else {
      safe = safe.slice(0, 100);
    }
  }
  return safe;
}
async function withBackoff(fn, { retries = 3, baseMs = 200 } = {}) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (e) {
      const status = e?.code || e?.response?.status;
      const retriable = status === 429 || (status >= 500 && status < 600);
      if (!retriable || attempt >= retries) {
        throw e;
      }
      const delay = Math.min(2000, baseMs * Math.pow(2, attempt));
      await new Promise((r) => setTimeout(r, delay));
      attempt += 1;
    }
  }
}

async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}

// Core middleware
app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    origin: process.env.WEB_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(
  cookieSession({
    name: 'sess',
    secret: process.env.SESSION_SECRET || 'change_me',
    httpOnly: true,
    sameSite: 'lax',
  })
);

// OAuth client for Google
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:4000/auth/google/callback'
);

function loadTokens() {
  try {
    const t = JSON.parse(fs.readFileSync(process.env.TOKEN_STORE || './tokens.json'));
    oauth2Client.setCredentials(t);
  } catch {
    // ignore if missing
  }
}
function saveTokens(tokens) {
  fs.writeFileSync(process.env.TOKEN_STORE || './tokens.json', JSON.stringify(tokens, null, 2));
}

// --- Auth routes ---
app.get('/auth/google/start', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive.file',
    ],
    prompt: 'consent',
  });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    saveTokens(tokens);
    res.send('Google auth complete. You can close this tab.');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Auth error', e?.response?.data || e?.message || e);
    res.status(500).send('Auth failed');
  }
});

// --- Docs APIs ---
app.get('/api/docs/master', async (req, res) => {
  try {
    loadTokens();
    const { docId } = req.query;
    if (!docId) return res.status(400).json({ error: 'docId required' });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    const meta = await drive.files.get({ fileId: docId, fields: 'id,name,mimeType' });
    const mime = meta.data.mimeType;
    if (mime !== 'application/vnd.google-apps.document') {
      return res.status(400).json({
        error:
          'Please use a Google Docs document. If this is a DOCX/PDF, open it in Google Docs (File > Save as Google Docs) and use that document ID.',
      });
    }

    // Read the structured body from Google Docs to reconstruct exact body text (avoids extra blank lines and "-----" artifacts).
    const doc = await docs.documents.get({ documentId: docId });

    function extractBodyText(document) {
      const chunks = [];
      function walk(elems) {
        if (!Array.isArray(elems)) return;
        for (const el of elems) {
          if (el.paragraph && Array.isArray(el.paragraph.elements)) {
            for (const pel of el.paragraph.elements) {
              if (pel.textRun && typeof pel.textRun.content === 'string') {
                chunks.push(pel.textRun.content);
              }
            }
          } else if (el.table && Array.isArray(el.table.tableRows)) {
            for (const row of el.table.tableRows) {
              if (!row || !Array.isArray(row.tableCells)) continue;
              for (const cell of row.tableCells) {
                if (cell && Array.isArray(cell.content)) {
                  walk(cell.content);
                }
              }
            }
          } else if (el.tableOfContents && Array.isArray(el.tableOfContents.content)) {
            walk(el.tableOfContents.content);
          } else if (el.horizontalRule) {
            // Represent horizontal rule minimally as a single newline to avoid "---------" artifacts
            chunks.push('\n');
          }
          // sectionBreak has no text content
        }
      }
      walk(document?.body?.content || []);
      return chunks.join('').replace(/\r\n/g, '\n');
    }

    const text = extractBodyText(doc.data);
    res.json({ text, meta: meta.data });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Load doc error', e?.response?.data || e?.message || e);
    const msg = e?.response?.data?.error?.message || e?.message || 'Failed to load doc';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/docs/save-tailored', async (req, res) => {
  try {
    loadTokens();
    const { targetDocId, tailoredText } = req.body || {};
    if (!targetDocId || typeof tailoredText !== 'string') {
      return res.status(400).json({ error: 'targetDocId and tailoredText required' });
    }
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    // Fetch current doc to get a stable endIndex and revisionId, then perform atomic clear+insert
    const existing = await docs.documents.get({ documentId: targetDocId });
    const content = existing.data.body?.content || [];
    const revisionId = existing.data.revisionId;
    let endIndex = content.reduce((max, el) => {
      const idx = typeof el.endIndex === 'number' ? el.endIndex : max;
      return idx > max ? idx : max;
    }, 1);
    if (!endIndex || endIndex < 2) endIndex = 1e9;
    // Docs API cannot delete the trailing newline at the end of the segment
    const deleteEnd = Math.max(1, endIndex - 1);

    // Preprocess text: detect simple bullets/numbered lines and strip their markers
    const lines = String(tailoredText || '').split('\n');
    const processedLines = [];
    const lineMeta = []; // { startOffset, length, kind: 'bulleted'|'numbered'|null }
    let offset = 0;
    for (const rawLine of lines) {
      const line = String(rawLine || '');
      let kind = null;
      let stripped = line;
      // Numbered list: "1. ", "1) "
      if (/^\s*\d+[\.\)]\s+/.test(stripped)) {
        kind = 'numbered';
        stripped = stripped.replace(/^\s*\d+[\.\)]\s+/, '');
      } else if (/^\s*[-*•]\s+/.test(stripped)) {
        // Bulleted: "- ", "* ", "• "
        kind = 'bulleted';
        stripped = stripped.replace(/^\s*[-*•]\s+/, '');
      }
      processedLines.push(stripped);
      lineMeta.push({ startOffset: offset, length: stripped.length, kind });
      // account for newline char in between lines
      offset += stripped.length + 1;
    }
    const newText = processedLines.join('\n');

    const requests = [];
    if (deleteEnd > 1) {
      requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: deleteEnd } } });
    }
    requests.push({ insertText: { location: { index: 1 }, text: newText } });

    // After insert, apply bullets to contiguous runs
    function pushBulletRuns(kind, preset) {
      let runStart = -1;
      let runEnd = -1;
      for (let i = 0; i < lineMeta.length; i++) {
        const m = lineMeta[i];
        const isKind = m.kind === kind;
        if (isKind && runStart === -1) {
          runStart = i;
          runEnd = i;
        } else if (isKind) {
          runEnd = i;
        }
        if ((!isKind && runStart !== -1) || (i === lineMeta.length - 1 && runStart !== -1)) {
          // finalize previous run
          const first = lineMeta[runStart];
          const last = lineMeta[runEnd];
          const startIndex = 1 + first.startOffset;
          // endIndex exclusive; cap at end of last line text (avoid trailing newline)
          const endIndexRun = 1 + last.startOffset + last.length;
          if (endIndexRun > startIndex) {
            requests.push({
              createParagraphBullets: {
                range: { startIndex, endIndex: endIndexRun },
                bulletPreset: preset,
              },
            });
          }
          runStart = -1;
          runEnd = -1;
        }
      }
    }
    // Apply bulleted then numbered runs
    pushBulletRuns('bulleted', 'BULLET_DISC_CIRCLE_SQUARE');
    pushBulletRuns('numbered', 'NUMBERED_DECIMAL_ALPHA_ROMAN');

    await docs.documents.batchUpdate({
      documentId: targetDocId,
      requestBody: {
        writeControl: revisionId ? { requiredRevisionId: revisionId } : undefined,
        requests,
      },
    });
    res.json({ ok: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Save doc error', e?.response?.data || e?.message || e);
    const msg = e?.response?.data?.error?.message || e?.message || 'Failed to save tailored doc';
    res.status(500).json({ error: msg });
  }
});

app.get('/api/docs/export', async (req, res) => {
  try {
    loadTokens();
    const { docId, format } = req.query || {};
    if (!docId) return res.status(400).json({ error: 'docId required' });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const mime =
      format === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';
    const stream = await drive.files.export({ fileId: docId, mimeType: mime }, { responseType: 'stream' });
    res.setHeader('Content-Type', mime);
    // Force a friendly download name
    const ext = String(format) === 'docx' ? 'docx' : 'pdf';
    const baseName = 'resume_Amirthavarshini_';
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.${ext}"`);
    stream.data.pipe(res);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Export error', e?.response?.data || e?.message || e);
    const msg = e?.response?.data?.error?.message || e?.message || 'Failed to export';
    res.status(500).json({ error: msg });
  }
});

// --- Save tailored by copying from master and applying sentence-level replacements ---
app.post('/api/docs/save-tailored-from-master', async (req, res) => {
  try {
    loadTokens();
    const { masterDocId, tailoredText, title } = req.body || {};
    if (!masterDocId || typeof tailoredText !== 'string') {
      return res.status(400).json({ error: 'masterDocId and tailoredText required' });
    }
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    // 1) Copy the master to a new doc to preserve formatting and links
    const copied = await drive.files.copy({
      fileId: masterDocId,
      requestBody: { name: title || 'resume_Amirthavarshini_' },
    });
    const newDocId = copied.data.id;

    // 2) Export master as plain text for sentence diff
    const exportStream = await drive.files.export(
      { fileId: masterDocId, mimeType: 'text/plain' },
      { responseType: 'stream' }
    );
    const masterText = await streamToString(exportStream.data);

    // 3) Compute sentence-level replacements
    const splitSentences = (t) => String(t || '')
      .replace(/\r\n/g, '\n')
      .split(/(?<=[\.\!\?])\s+|\n+/g) // splits on sentence boundaries and newlines
      .map(s => s.trim())
      .filter(Boolean);

    const masterSents = splitSentences(masterText);
    const tailoredSents = splitSentences(tailoredText);
    const minLen = Math.min(masterSents.length, tailoredSents.length);

    // 4) Build replace requests only for changed sentences
    const replaceRequests = [];
    for (let i = 0; i < minLen; i++) {
      const orig = masterSents[i];
      const mod = tailoredSents[i];
      if (orig && mod && orig !== mod) {
        // Replace exact original sentence text wherever it appears; preserve other formatting in doc
        replaceRequests.push({
          replaceAllText: {
            containsText: { text: orig, matchCase: true },
            replaceText: mod,
          },
        });
      }
    }

    // If tailored has extra trailing sentences, append them at the end
    const extra = tailoredSents.slice(minLen).join('\n');

    // 5) Apply replacements (and append extras) to the new doc atomically where possible
    // First apply replacements to avoid index drift
    if (replaceRequests.length > 0) {
      const freshMeta = await docs.documents.get({ documentId: newDocId });
      const revisionId = freshMeta.data.revisionId;
      await docs.documents.batchUpdate({
        documentId: newDocId,
        requestBody: {
          writeControl: revisionId ? { requiredRevisionId: revisionId } : undefined,
          requests: replaceRequests,
        },
      });
    }
    // Then append extras at the end (if any), using current end index
    if (extra) {
      const meta2 = await docs.documents.get({ documentId: newDocId });
      const content2 = meta2.data.body?.content || [];
      const endIndex2 = content2.reduce((max, el) => {
        const idx = typeof el.endIndex === 'number' ? el.endIndex : max;
        return idx > max ? idx : max;
      }, 1);
      const insertIndex = Math.max(1, endIndex2 - 1);
      await docs.documents.batchUpdate({
        documentId: newDocId,
        requestBody: {
          requests: [{
            insertText: {
              location: { index: insertIndex },
              text: (insertIndex > 1 ? '\n' : '') + extra,
            },
          }],
        },
      });
    }

    res.json({ ok: true, newDocId });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Save-from-master error', e?.response?.data || e?.message || e);
    const msg = e?.response?.data?.error?.message || e?.message || 'Save from master failed';
    res.status(500).json({ error: msg });
  }
});

// --- Save tailored by copying from master and applying character-level diff/patch ---
app.post('/api/docs/save-tailored-diff', async (req, res) => {
  try {
    loadTokens();
    const { masterDocId, masterText: masterTextRaw, tailoredText: tailoredTextRaw, title } = req.body || {};
    if (!masterDocId || typeof tailoredTextRaw !== 'string') {
      return res.status(400).json({ error: 'masterDocId and tailoredText required' });
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    // 1) Copy the master to a new doc to preserve original formatting and links
    const copied = await drive.files.copy({
      fileId: masterDocId,
      requestBody: { name: title || 'resume_Amirthavarshini_' },
    });
    const newDocId = copied.data.id;
    // If caller provided an existing targetDocId, delete it now to avoid clutter (keep only one tailored doc)
    const priorTargetId = (req.body && req.body.targetDocId) ? String(req.body.targetDocId) : '';
    if (priorTargetId && priorTargetId !== newDocId) {
      try {
        await drive.files.delete({ fileId: priorTargetId });
      } catch {
        // ignore deletion errors (e.g., already removed or no permission)
      }
    }

    // 2) Fetch the copied document and reconstruct its BODY text exactly as Docs stores it.
    //    This ensures our indices align with the internal representation (avoids misplacements).
    const docMeta = await docs.documents.get({ documentId: newDocId });

    function extractBody(document) {
      const chunks = [];
      const paragraphs = []; // { start, end, isList }
      let offset = 0;

      function consumeParagraph(p) {
        let paraText = '';
        if (Array.isArray(p.elements)) {
          for (const pel of p.elements) {
            if (pel.textRun && typeof pel.textRun.content === 'string') {
              paraText += pel.textRun.content;
            }
          }
        }
        const start = offset;
        chunks.push(paraText);
        offset += paraText.length;
        const end = offset;
        paragraphs.push({ start, end, isList: !!p.bullet });
      }

      function walkStructuralElements(elems) {
        if (!Array.isArray(elems)) return;
        for (const el of elems) {
          if (el.paragraph) {
            consumeParagraph(el.paragraph);
          } else if (el.table && Array.isArray(el.table.tableRows)) {
            for (const row of el.table.tableRows) {
              if (!row || !Array.isArray(row.tableCells)) continue;
              for (const cell of row.tableCells) {
                if (cell && Array.isArray(cell.content)) {
                  walkStructuralElements(cell.content);
                }
              }
            }
          } else if (el.tableOfContents && Array.isArray(el.tableOfContents.content)) {
            walkStructuralElements(el.tableOfContents.content);
          }
          // sectionBreak has no text content
        }
      }
      walkStructuralElements(document?.body?.content || []);
      return { text: chunks.join(''), paragraphs };
    }

    const body = extractBody(docMeta.data);
    const baseDocText = String(body.text || '').replace(/\r\n/g, '\n');

    // Normalize tailored; ensure trailing newline to match Docs invariant.
    let tailoredTextNorm = String(tailoredTextRaw || '').replace(/\r\n/g, '\n');

    // Always strip a literal leading "*" bullet marker from ALL lines (user-added textual bullets)
    // This prevents double bullets when the doc already has list styling.
    const tailoredLines = tailoredTextNorm.split('\n');
    const leadingStarRe = /^[\uFEFF\u200B\u200C\u200D\s]*\*\s+/;
    for (let j = 0; j < tailoredLines.length; j++) {
      const line = tailoredLines[j] ?? '';
      if (leadingStarRe.test(line)) {
        tailoredLines[j] = line.replace(leadingStarRe, '');
      }
    }

    // For lines that correspond to list paragraphs, also strip other leading markers like "-", "•", "1. "/ "1) "
    const masterLines = baseDocText.split('\n');

    const maxLines = Math.min(masterLines.length, tailoredLines.length, body.paragraphs.length);
    const bulletPrefixRe = /^\s*(?:[-•·▪‣◦–—]\s+|\d+[\.\)]\s+)/;
    for (let i = 0; i < maxLines; i++) {
      const isList = !!body.paragraphs[i]?.isList;
      if (isList) {
        const line = tailoredLines[i] ?? '';
        if (bulletPrefixRe.test(line)) {
          tailoredLines[i] = line.replace(bulletPrefixRe, '');
        }
      }
    }

    let tailoredText = tailoredLines.join('\n');
    if (!tailoredText.endsWith('\n')) tailoredText += '\n';

    // Safety: Also ensure base text ends with trailing newline (Docs body should, but normalize anyway)
    const masterBodyText = baseDocText.endsWith('\n') ? baseDocText : (baseDocText + '\n');

    // 3) Compute character-level diffs
    const dmp = new DiffMatchPatch();
    // Optional: make sure we don't run forever on pathological inputs
    dmp.Diff_Timeout = 1.0;
    const diffs = dmp.diff_main(masterBodyText, tailoredText);
    dmp.diff_cleanupSemantic(diffs);

    // 4) Convert diffs into grouped changes (splices) relative to master text
    // Each change: { index, deleteCount, insertText }
    const changes = [];
    let cursor = 0; // position within masterBodyText
    let pending = null; // { start, deleteCount, insertText }

    function flushPending() {
      if (pending && (pending.deleteCount > 0 || (pending.insertText && pending.insertText.length))) {
        changes.push({
          index: pending.start,
          deleteCount: pending.deleteCount || 0,
          insertText: pending.insertText || '',
        });
      }
      pending = null;
    }

    for (const [op, data] of diffs) {
      const text = String(data || '');
      if (op === 0) { // EQUAL
        // finalize any pending change before moving cursor
        flushPending();
        cursor += text.length;
      } else if (op === -1) { // DELETE
        if (!pending) pending = { start: cursor, deleteCount: 0, insertText: '' };
        pending.deleteCount += text.length;
        cursor += text.length;
      } else if (op === 1) { // INSERT
        if (!pending) pending = { start: cursor, deleteCount: 0, insertText: '' };
        pending.insertText += text;
      }
    }
    flushPending();

    // 5) Translate changes to Docs API requests, descending by index to keep indices stable
    // Docs body content starts at index 1; there is a trailing newline that cannot be deleted
    const requests = [];
    // Sort by index desc
    changes.sort((a, b) => b.index - a.index);

    // Compute last deletable absolute index in BODY (0-based within our strings):
    // Docs keeps a guaranteed trailing newline; do not delete past (length - 1).
    const bodyLength = masterBodyText.length;
    const lastDeletableZeroBased = Math.max(0, bodyLength - 1 - 0); // final newline index is (length - 1)

    for (const ch of changes) {
      const startIndex = 1 + ch.index; // Docs index is 1-based

      // Cap deletes so we never remove the trailing newline
      let deleteCount = ch.deleteCount || 0;
      if (deleteCount > 0) {
        const maxDeletableCount = Math.max(0, lastDeletableZeroBased - ch.index);
        if (deleteCount > maxDeletableCount) deleteCount = maxDeletableCount;
      }

      if (deleteCount > 0) {
        const endIndex = startIndex + deleteCount;
        if (endIndex > startIndex) {
          requests.push({
            deleteContentRange: { range: { startIndex, endIndex } },
          });
        }
      }
      if (ch.insertText && ch.insertText.length) {
        requests.push({
          insertText: { location: { index: startIndex }, text: ch.insertText },
        });
      }
    }

    // 6) Apply in a single batchUpdate for atomicity
    const meta = await docs.documents.get({ documentId: newDocId });
    const revisionId = meta.data.revisionId;
    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId: newDocId,
        requestBody: {
          writeControl: revisionId ? { requiredRevisionId: revisionId } : undefined,
          requests,
        },
      });
    }

    res.json({ ok: true, newDocId, changesApplied: changes.length });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Save-diff error', e?.response?.data || e?.message || e);
    const msg = e?.response?.data?.error?.message || e?.message || 'Save with diff failed';
    res.status(500).json({ error: msg });
  }
});

// --- Save tailored into an existing target copied from master (preserve formatting) ---
app.post('/api/docs/save-tailored-into-target', async (req, res) => {
  try {
    loadTokens();
    const { masterDocId, targetDocId, tailoredText } = req.body || {};
    if (!masterDocId || !targetDocId || typeof tailoredText !== 'string') {
      return res.status(400).json({ error: 'masterDocId, targetDocId and tailoredText required' });
    }
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    // 1) Export master as plain text (for diff only; do not reset target to avoid formatting loss)
    const exportStream = await drive.files.export(
      { fileId: masterDocId, mimeType: 'text/plain' },
      { responseType: 'stream' }
    );
    const masterText = await streamToString(exportStream.data);

    // 2) Compute sentence-level replacements
    const splitSentences = (t) => String(t || '')
      .replace(/\r\n/g, '\n')
      .split(/(?<=[\.\!\?])\s+|\n+/g)
      .map(s => s.trim())
      .filter(Boolean);
    const masterSents = splitSentences(masterText);
    const tailoredSents = splitSentences(tailoredText);
    const minLen = Math.min(masterSents.length, tailoredSents.length);

    const replaceRequests = [];
    for (let i = 0; i < minLen; i++) {
      const orig = masterSents[i];
      const mod = tailoredSents[i];
      if (orig && mod && orig !== mod) {
        replaceRequests.push({
          replaceAllText: {
            containsText: { text: orig, matchCase: true },
            replaceText: mod,
          },
        });
      }
    }
    const extra = tailoredSents.slice(minLen).join('\n');

    // 3) Apply replacements
    if (replaceRequests.length > 0) {
      const freshMeta = await docs.documents.get({ documentId: targetDocId });
      const revisionId = freshMeta.data.revisionId;
      await docs.documents.batchUpdate({
        documentId: targetDocId,
        requestBody: {
          writeControl: revisionId ? { requiredRevisionId: revisionId } : undefined,
          requests: replaceRequests,
        },
      });
    }
    // 4) Skip appending extras to avoid stacking; only in-place sentence changes are applied

    res.json({ ok: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Save-into-target error', e?.response?.data || e?.message || e);
    const msg = e?.response?.data?.error?.message || e?.message || 'Save into target failed';
    res.status(500).json({ error: msg });
  }
});

// --- Tailor API (Gemini minimal-edits) ---
app.post('/api/tailor', async (req, res) => {
  try {
    const { resumeText, missingKeywords = [], jobContext } = req.body || {};
    if (!resumeText || !Array.isArray(missingKeywords)) {
      return res.status(400).json({ error: 'resumeText and missingKeywords[] required' });
    }
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY missing' });

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    const prompt = [
      'You are an expert resume editor.',
      'Task: Integrate the provided keywords into the resume with MINIMAL edits.',
      '- Only add or subtly insert words/short phrases; do NOT rewrite sentences.',
      '- Prefer Experience, Projects, Summary; use Skills only if nowhere else fits.',
      '- Keep tone and formatting unchanged.',
      '- Output MUST be a JSON array of objects with EXACT keys: "original_sentence", "modified_sentence", "keyword_added".',
      '- Do not include any commentary, code fences, or extra text.',
      `Keywords: ${JSON.stringify(missingKeywords)}`,
      jobContext ? `Job context: ${jobContext}` : '',
      'Resume:',
      resumeText,
    ].join('\n');
    const out = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              original_sentence: { type: 'string' },
              modified_sentence: { type: 'string' },
              keyword_added: { type: 'string' },
            },
            required: ['original_sentence', 'modified_sentence', 'keyword_added'],
          },
        },
      },
    });
    let text = out.response.text();
    let changes = [];
    const tryLenientParse = (t) => {
      let s = String(t || '').trim();
      s = s.replace(/```json/gi, '```').replace(/```/g, '');
      const firstArr = s.indexOf('[');
      const lastArr = s.lastIndexOf(']');
      if (firstArr !== -1 && lastArr !== -1 && lastArr > firstArr) {
        s = s.slice(firstArr, lastArr + 1);
      }
      return JSON.parse(s);
    };
    try {
      changes = JSON.parse(text);
    } catch {
      try {
        changes = tryLenientParse(text);
      } catch {
        // Retry once with stricter instruction to return ONLY JSON
        const retry = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [{
              text: 'Return ONLY a JSON array with objects {"original_sentence","modified_sentence","keyword_added"} for the prior task. No prose, no code fences.',
            }],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  original_sentence: { type: 'string' },
                  modified_sentence: { type: 'string' },
                  keyword_added: { type: 'string' },
                },
                required: ['original_sentence', 'modified_sentence', 'keyword_added'],
              },
            },
          },
        });
        text = retry.response.text();
        try {
          changes = JSON.parse(text);
        } catch {
          try {
            changes = tryLenientParse(text);
          } catch {
            return res.status(400).json({ error: 'Model did not return JSON', raw: text });
          }
        }
      }
    }
    // Compose naive replacements; caller can refine or show diff
    let tailoredText = resumeText;
    for (const c of changes) {
      if (c?.original_sentence && c?.modified_sentence && tailoredText.includes(c.original_sentence)) {
        tailoredText = tailoredText.replace(c.original_sentence, c.modified_sentence);
      }
    }
    res.json({ changes, tailoredText });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Tailor error', e?.response?.data || e?.message || e);
    const msg = e?.response?.data?.error?.message || e?.message || 'Tailor failed';
    res.status(500).json({ error: msg });
  }
});

// --- Search Docs (ease of selection) ---
app.get('/api/docs/search', async (req, res) => {
  try {
    loadTokens();
    const { q } = req.query || {};
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const queryParts = [
      "mimeType = 'application/vnd.google-apps.document'",
      "trashed = false",
    ];
    if (q) {
      const escaped = String(q).replace(/'/g, "\\'");
      queryParts.push(`(name contains '${escaped}' or fullText contains '${escaped}')`);
    }
    const resp = await drive.files.list({
      q: queryParts.join(' and '),
      pageSize: 10,
      orderBy: 'modifiedTime desc',
      fields: 'files(id,name,modifiedTime,owners(displayName,emailAddress))',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'user',
    });
    res.json({ files: resp.data.files || [] });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Search docs error', e?.response?.data || e?.message || e);
    const msg = e?.response?.data?.error?.message || e?.message || 'Search failed';
    res.status(500).json({ error: msg });
  }
});

// --- Create Doc (easy target doc creation) ---
app.post('/api/docs/create', async (req, res) => {
  try {
    loadTokens();
    const { title } = req.body || {};
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    const created = await docs.documents.create({ requestBody: { title: title || 'resume_Amirthavarshini_' } });
    res.json({ documentId: created.data.documentId, title: created.data.title });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Create doc error', e?.response?.data || e?.message || e);
    const msg = e?.response?.data?.error?.message || e?.message || 'Create failed';
    res.status(500).json({ error: msg });
  }
});

// Root health
app.get('/', (_req, res) => {
  res.send('Resume Matcher backend OK');
});

// --- Compute keywords (simple diff fallback) ---
app.post('/api/keywords/compute', async (req, res) => {
  try {
    const { resumeText = '', jobText = '' } = req.body || {};
    const stop = new Set([
      'the','and','to','of','a','in','for','on','with','is','as','by','be','or','an','at','from','are','this','that','it','your','you','we','our','their','they','i',
      'will','have','has','had','was','were','can','could','should','would','do','does','did','not','no','yes','but','if','than','then','so','such','per','per','per',
      'into','over','under','across','about','up','down','out','within','between','new','years','year','using','use','used','including','include','includes','etc',
      'experience','responsibilities','responsibility','requirements','preferred','skills','skill','role','roles','team','teams','work','working','ability'
    ]);
    const tokenize = (t) =>
      String(t || '')
        .toLowerCase()
        .replace(/[^a-z0-9+\-#./ ]+/g, ' ')
        .split(/\s+/)
        .filter((w) => w && w.length > 1 && !stop.has(w));
    const uniq = (arr) => Array.from(new Set(arr));
    const resumeTokens = uniq(tokenize(resumeText));
    const jobTokens = uniq(tokenize(jobText));
    const resumeSet = new Set(resumeTokens);
    const jobSet = new Set(jobTokens);
    const matches = jobTokens.filter((w) => resumeSet.has(w));
    const unmatches = jobTokens.filter((w) => !resumeSet.has(w));
    res.json({ matches, unmatches, score: jobSet.size ? matches.length / jobSet.size : 0 });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Compute keywords error', e?.message || e);
    res.status(500).json({ error: 'Compute failed' });
  }
});

// --- Start server ---
const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend on http://localhost:${port}`);
});


