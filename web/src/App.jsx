import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Slate, Editable, withReact } from 'slate-react'
import { createEditor, Node } from 'slate'
import { withHistory } from 'slate-history'
import './App.css'

function App() {
	const [resumeText, setResumeText] = useState('')
	const [tailoredText, setTailoredText] = useState('')
	const [missing, setMissing] = useState([])
	const [aiChanges, setAiChanges] = useState([])
	const [aiBaseline, setAiBaseline] = useState('')
	const editor = useMemo(() => withHistory(withReact(createEditor())), [])
	const [value, setValue] = useState([{ type: 'paragraph', children: [{ text: '' }] }])
	const [editorKey, setEditorKey] = useState(0)
	const [aiRanges, setAiRanges] = useState([])
	const [manualRanges, setManualRanges] = useState([])
	const [missingRanges, setMissingRanges] = useState([])
	const [isTailoring, setIsTailoring] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const containerRef = useRef(null)
	const [leftPct, setLeftPct] = useState(50)
	const [dragging, setDragging] = useState(false)

	function startDrag(clientX) {
		const el = containerRef.current
		if (!el) return
		const rect = el.getBoundingClientRect()
		const pct = ((clientX - rect.left) / rect.width) * 100
		const clamped = Math.max(20, Math.min(80, pct))
		setLeftPct(clamped)
	}
	function onDividerMouseDown(e) {
		e.preventDefault()
		setDragging(true)
		const move = (ev) => startDrag(ev.clientX)
		const up = () => {
			setDragging(false)
			window.removeEventListener('mousemove', move)
			window.removeEventListener('mouseup', up)
		}
		window.addEventListener('mousemove', move)
		window.addEventListener('mouseup', up)
	}
	function onDividerTouchStart(e) {
		const touch = e.touches && e.touches[0]
		if (!touch) return
		setDragging(true)
		const move = (ev) => {
			const t = ev.touches && ev.touches[0]
			if (t) startDrag(t.clientX)
		}
		const end = () => {
			setDragging(false)
			window.removeEventListener('touchmove', move)
			window.removeEventListener('touchend', end)
			window.removeEventListener('touchcancel', end)
		}
		window.addEventListener('touchmove', move, { passive: false })
		window.addEventListener('touchend', end)
		window.addEventListener('touchcancel', end)
	}
	const [jobText, setJobText] = useState('')
	const [jobUrl, setJobUrl] = useState('')
	const [masterDocId, setMasterDocId] = useState('')
	const [targetDocId, setTargetDocId] = useState('')
	const [qMaster, setQMaster] = useState('')
	const [qTarget, setQTarget] = useState('')
	const [masterResults, setMasterResults] = useState([])
	const [targetResults, setTargetResults] = useState([])
	const [createTitle, setCreateTitle] = useState('resume_Amirthavarshini_')

	// Persist IDs locally so you don't re-enter them every time
	useEffect(() => {
		try {
			const m = localStorage.getItem('rm_masterDocId')
			const t = localStorage.getItem('rm_targetDocId')
			if (m) setMasterDocId(m)
			if (t) setTargetDocId(t)
			// Restore last tailored session (content + highlights + missing)
			const savedTailored = localStorage.getItem('rm_tailoredText')
			if (savedTailored) {
				setTailoredText(savedTailored)
				setAiBaseline(savedTailored)
			}
			const savedChanges = localStorage.getItem('rm_aiChanges')
			if (savedChanges) {
				const parsed = JSON.parse(savedChanges)
				setAiChanges(parsed)
				const changedSentences = Array.isArray(parsed) ? parsed.map(c => c?.modified_sentence).filter(Boolean) : []
				if (savedTailored && changedSentences.length) {
					setAiRanges(buildRangesForSubstrings(savedTailored, changedSentences, 'ai'))
				}
			}
			const savedMissing = localStorage.getItem('rm_missing')
			if (savedMissing) {
				const parsedMissing = JSON.parse(savedMissing)
				if (Array.isArray(parsedMissing)) setMissing(parsedMissing)
			}
			const savedJobText = localStorage.getItem('rm_jobText')
			if (savedJobText) setJobText(savedJobText)
			const savedJobUrl = localStorage.getItem('rm_jobUrl')
			if (savedJobUrl) setJobUrl(savedJobUrl)
		} catch { }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Parse URL param fallback: ?rm=<base64 of { unmatches:[], jobUrl:string }>
	useEffect(() => {
		try {
			const url = new URL(window.location.href)
			const rmParam = url.searchParams.get('rm')
			if (rmParam) {
				const decoded = JSON.parse(atob(decodeURIComponent(rmParam)))
				console.log('>>>>>>>>rm_param', decoded)
				if (Array.isArray(decoded?.unmatches) && decoded.unmatches.length) {
					setMissing(decoded.unmatches)
				}
				if (typeof decoded?.jobUrl === 'string' && decoded.jobUrl) {
					setJobUrl(decoded.jobUrl)
				}
			}
		} catch (e) {
			console.warn('>>>>>>>>rm_param parse failed', e)
		}
	}, [])
	useEffect(() => {
		try { localStorage.setItem('rm_masterDocId', masterDocId || '') } catch { }
	}, [masterDocId])
	useEffect(() => {
		try { localStorage.setItem('rm_targetDocId', targetDocId || '') } catch { }
	}, [targetDocId])
	useEffect(() => {
		try { localStorage.setItem('rm_tailoredText', tailoredText || '') } catch { }
	}, [tailoredText])
	useEffect(() => {
		try { localStorage.setItem('rm_aiChanges', JSON.stringify(aiChanges || [])) } catch { }
	}, [aiChanges])
	useEffect(() => {
		try { localStorage.setItem('rm_missing', JSON.stringify(missing || [])) } catch { }
	}, [missing])
	useEffect(() => {
		try { if (jobText) localStorage.setItem('rm_jobText', jobText) } catch { }
	}, [jobText])
	useEffect(() => {
		try { if (jobUrl) localStorage.setItem('rm_jobUrl', jobUrl) } catch { }
	}, [jobUrl])

	useEffect(() => {
		const handler = (e) => {
			if (e?.data?.type === 'rm_payload') {
				console.log('>>>>>>>>rm_payload', e.data.payload)
				const { unmatches = [], jobText = '', jobUrl = '' } = e.data.payload || {}
				setMissing(Array.isArray(unmatches) ? unmatches : [])
				if (typeof jobText === 'string') setJobText(jobText)
				if (typeof jobUrl === 'string') setJobUrl(jobUrl)
			}
		}
		window.addEventListener('message', handler)
		// Also read from sessionStorage in case the message arrived before mount
		try {
			const cached = sessionStorage.getItem('rm_payload')
			if (cached) {
				const payload = JSON.parse(cached)
				console.log('>>>>>>>>rm_payload(sessionStorage)', payload)
				if (Array.isArray(payload?.unmatches)) {
					setMissing(payload.unmatches)
				}
				if (typeof payload?.jobText === 'string') setJobText(payload.jobText)
				if (typeof payload?.jobUrl === 'string') setJobUrl(payload.jobUrl)
			}
		} catch { }
		return () => window.removeEventListener('message', handler)
	}, [])

	// Lightweight fallback: derive missing keywords from job text vs resume when Jobalytics data isn't available.
	function deriveMissingKeywordsSimple(resume, job) {
		if (!resume || !job) return []
		const stop = new Set([
			'the', 'and', 'for', 'with', 'in', 'of', 'to', 'a', 'an', 'on', 'at', 'by', 'from', 'as', 'is', 'be', 'are', 'were', 'was', 'or',
			'that', 'this', 'it', 'your', 'our', 'we', 'you', 'their', 'they', 'them', 'he', 'she', 'his', 'her', 'its', 'but', 'if', 'then',
			'into', 'within', 'across', 'about', 'over', 'under', 'not', 'no', 'yes', 'can', 'will', 'able'
		])
		const normalize = (t) => t.toLowerCase()
		const tokenize = (t) => {
			const lower = normalize(t)
			// capture tech-ish tokens and words, keep + # . / - inside tokens (e.g. c++, c#, node.js, ci/cd)
			const raw = lower.match(/[a-z0-9][a-z0-9+\#\.\-\/]*|c\+\+|c#|ci\/cd/g) || []
			const cleaned = raw
				.map(x => x.trim())
				.filter(x => x && !/^[0-9\.\-\/]+$/.test(x)) // drop mostly numeric
				.filter(x => x.length >= 3 || x === 'c' || x === 'go' || x === 'ai' || x === 'ml')
				.filter(x => !stop.has(x))
			return cleaned
		}
		const resumeTokens = tokenize(resume)
		const jobTokens = tokenize(job)
		const resumeSet = new Set(resumeTokens)
		const freq = new Map()
		for (const tok of jobTokens) {
			freq.set(tok, (freq.get(tok) || 0) + 1)
		}
		// difference: tokens present in job but not in resume
		const diff = []
		for (const [tok, count] of freq.entries()) {
			if (!resumeSet.has(tok)) diff.push([tok, count])
		}
		// sort by frequency desc, then alpha
		diff.sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1))
		// limit to a reasonable number
		return diff.slice(0, 50).map(([tok]) => tok)
	}

	// Auto-derive missing if empty but we have both resume and job text
	useEffect(() => {
		if ((!missing || missing.length === 0) && resumeText && jobText) {
			console.log('>>>>>>>>derive_missing_fallback start, resumeText.length:', resumeText.length, 'jobText.length:', jobText.length)
			const derived = deriveMissingKeywordsSimple(resumeText, jobText)
			console.log('>>>>>>>>derive_missing_fallback derived.length:', derived.length, derived.slice(0, 20))
			if (derived.length) setMissing(derived)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [resumeText, jobText])

	const backend = import.meta.env.VITE_BACKEND || 'http://localhost:4000'

	const signInGoogle = () => {
		window.open(`${backend}/auth/google/start`, '_blank')
	}
	const openTargetDoc = () => {
		if (!targetDocId) { alert('Enter targetDocId'); return }
		window.open(`https://docs.google.com/document/d/${targetDocId}/edit`, '_blank', 'noopener,noreferrer')
	}

	// Helpers to keep Slate editor in sync with tailoredText
	function toNodes(text) {
		return [{ type: 'paragraph', children: [{ text: text || '' }] }]
	}
	function getEditorString() {
		try { return Node.string({ children: value }) } catch { return '' }
	}
	// Note: we update the editor value directly in loadMaster/tailor instead of reacting to tailoredText

	const loadMaster = async () => {
		if (!masterDocId) {
			alert('Enter masterDocId')
			return null
		}
		try {
			const { data } = await axios.get(`${backend}/api/docs/master`, {
				params: { docId: masterDocId },
				withCredentials: true
			})
			setResumeText(data.text || '')
			const text = data.text || ''
			setTailoredText(text)
			// programmatic initialize editor content and reset highlights
			setValue(toNodes(text))
			setEditorKey(k => k + 1)
			setAiBaseline('')
			setAiChanges([])
			setAiRanges([])
			setManualRanges([])
			return text
		} catch (e) {
			const msg = e?.response?.data?.error || e?.message || 'Failed to load doc'
			alert(`Load failed: ${msg}\n\nTips:\n- Use a Google Docs file (not PDF/DOCX)\n- Copy the ID from https://docs.google.com/document/d/ID/edit\n- Share the doc with the Google account you authenticated`)
			return null
		}
	}

	const tailor = async (loadedResumeText) => {
		const textToTailor = loadedResumeText || resumeText
		if (!textToTailor) {
			alert('Load master resume first')
			return null
		}
		setIsTailoring(true)
		// Ensure we have missing keywords; derive if Jobalytics didn't populate them
		let missingFinal = missing
		if ((!missingFinal || missingFinal.length === 0) && jobText) {
			missingFinal = deriveMissingKeywordsSimple(textToTailor, jobText)
			setMissing(missingFinal)
		}
		try {
			console.log('>>>>>>>>tailoring', missingFinal)
			const { data } = await axios.post(`${backend}/api/tailor`, {
				resumeText: textToTailor,
				missingKeywords: missingFinal
			}, { withCredentials: true })
			const text = data.tailoredText || ''
			setTailoredText(text)
			setAiBaseline(text)
			setAiChanges(Array.isArray(data.changes) ? data.changes : [])
			// Build AI ranges from modified sentences
			const changedSentences = (Array.isArray(data.changes) ? data.changes : []).map(c => c.modified_sentence).filter(Boolean)
			setAiRanges(buildRangesForSubstrings(text, changedSentences, 'ai'))
			// Programmatically update editor content to AI text
			setValue(toNodes(text))
			setEditorKey(k => k + 1)
			return text
		} catch (e) {
			const msg = e?.response?.data?.error || e?.message || 'Tailor failed'
			alert(`AI error: ${msg}`)
			return null
		} finally {
			setIsTailoring(false)
		}
	}

	// Build ranges for decorations (for a single paragraph, path [0,0])
	function buildRangesForSubstrings(text, substrings, key) {
		if (!text || !Array.isArray(substrings) || substrings.length === 0) return []
		const ranges = []
		for (const sub of substrings) {
			if (!sub) continue
			let fromIndex = 0
			while (fromIndex <= text.length) {
				const idx = text.indexOf(sub, fromIndex)
				if (idx === -1) break
				ranges.push({
					anchor: { path: [0, 0], offset: idx },
					focus: { path: [0, 0], offset: idx + sub.length },
					[key]: true
				})
				fromIndex = idx + sub.length
			}
		}
		return ranges
	}

	// Utility: escape regex specials
	function escapeRegExp(str) {
		return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	}
	// Build ranges for a list of words (case-insensitive); try whole-word match when possible
	function buildWordRangesForList(text, words, key) {
		if (!text || !Array.isArray(words) || words.length === 0) return []
		const ranges = []
		for (const raw of words) {
			if (!raw) continue
			const w = String(raw).trim()
			if (!w) continue
			const hasSpecial = /[^a-z0-9]/i.test(w)
			const pattern = hasSpecial ? escapeRegExp(w) : `\\b${escapeRegExp(w)}\\b`
			const re = new RegExp(pattern, 'gi')
			let m
			while ((m = re.exec(text)) !== null) {
				const start = m.index
				const end = start + m[0].length
				ranges.push({
					anchor: { path: [0, 0], offset: start },
					focus: { path: [0, 0], offset: end },
					[key]: true
				})
				if (m.index === re.lastIndex) re.lastIndex++
			}
		}
		return ranges
	}

	// Recompute manual edit ranges whenever user edits after AI baseline exists
	useEffect(() => {
		if (!aiBaseline) return
		const current = getEditorString()
		if (!current) { setManualRanges([]); return }
		if (current === aiBaseline) { setManualRanges([]); return }
		// Diff by sentences: mark sentences that are present in current but not in baseline
		const sentSplit = (t) => (t || '').split(/(?<=[\.\!\?])\s+/g).map(s => s.trim()).filter(Boolean)
		const currentSents = sentSplit(current)
		const baseSents = new Set(sentSplit(aiBaseline))
		const manualSents = currentSents.filter(s => !baseSents.has(s))
		setManualRanges(buildRangesForSubstrings(current, manualSents, 'manual'))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value])

	// Persist editor content to localStorage for resilience across tab switches
	useEffect(() => {
		try {
			const current = getEditorString()
			localStorage.setItem('rm_tailoredText', current || '')
		} catch { }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value])

	// Build missing keyword ranges whenever content or list changes
	useEffect(() => {
		const current = getEditorString()
		if (!current || !missing || missing.length === 0) {
			setMissingRanges([])
			return
		}
		setMissingRanges(buildWordRangesForList(current, missing, 'missing'))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value, missing])

	// Slate decorations combine aiRanges and manualRanges
	const decorate = useMemo(() => ([_node, path]) => {
		// We built ranges for path [0,0] only
		if (path.length === 2 && path[0] === 0 && path[1] === 0) {
			return [...aiRanges, ...manualRanges, ...missingRanges]
		}
		return []
	}, [aiRanges, manualRanges, missingRanges])

	const renderLeaf = useMemo(() => (props) => {
		const { attributes, children, leaf } = props
		let style = {}
		if (leaf.ai) {
			style = { ...style, backgroundColor: '#c2f542' } // Lime Green
		}
		if (leaf.manual) {
			style = { ...style, backgroundColor: '#fa7a66' } // Salmon
		}
		if (leaf.missing) {
			// distinguish missing keywords: Blue background + subtle shadow
			style = { ...style, backgroundColor: '#7a9cfa', boxShadow: 'inset 0 -2px 0 #cfe3ff' }
		}
		return <span {...attributes} style={style}>{children}</span>
	}, [])

	const saveTailored = async (generatedTailoredText) => {
		try {
			setIsSaving(true)
			const current = generatedTailoredText || getEditorString()
			if (!masterDocId) { alert('Set masterDocId before saving'); return }
			// Use character-level diff & patch on a fresh copy of the master to preserve formatting/links
			const { data } = await axios.post(`${backend}/api/docs/save-tailored-diff`, {
				masterDocId,
				masterText: resumeText,
				targetDocId,
				tailoredText: current,
				title: createTitle || 'resume_Amirthavarshini_'
			}, { withCredentials: true })
			if (data?.newDocId) {
				setTargetDocId(data.newDocId)
				try { localStorage.setItem('rm_targetDocId', data.newDocId) } catch { }
			}
			alert('Saved (diff-patched on a fresh copy of master)')
		} catch (e) {
			const msg = e?.response?.data?.error || e?.message || 'Save failed'
			alert(`Save failed: ${msg}`)
		} finally {
			setIsSaving(false)
		}
	}

	const downloadDocxRef = useRef(null)

	const executeAll = async () => {
		// 1. Load Master
		// 2. AI Tailor
		// 3. Confirm & Save
		// 4. Download DOCX
		// We override window.alert temporarily to avoid blocking
		const originalAlert = window.alert
		window.alert = (msg) => console.log('Automated Alert:', msg)

		try {
			console.log('>>> EXECUTE ALL: Starting...')
			const loadedText = await loadMaster()
			if (!loadedText) throw new Error('Failed to load master')
			console.log('>>> EXECUTE ALL: Master loaded')

			// Small delay to ensure state settles if needed, though we pass data directly
			await new Promise(r => setTimeout(r, 500))

			const tailored = await tailor(loadedText)
			if (!tailored) throw new Error('Failed to tailor')
			console.log('>>> EXECUTE ALL: Tailored')

			await new Promise(r => setTimeout(r, 500))

			await saveTailored(tailored)
			console.log('>>> EXECUTE ALL: Saved')

			await new Promise(r => setTimeout(r, 500))

			if (downloadDocxRef.current) {
				downloadDocxRef.current.click()
				console.log('>>> EXECUTE ALL: Download triggered')
			}
		} catch (e) {
			console.error('>>> EXECUTE ALL FAILED:', e)
			originalAlert('Automation failed: ' + e.message)
		} finally {
			window.alert = originalAlert
		}
	}

	const searchMaster = async () => {
		try {
			const { data } = await axios.get(`${backend}/api/docs/search`, { params: { q: qMaster }, withCredentials: true })
			setMasterResults(data.files || [])
		} catch (e) {
			alert(e?.response?.data?.error || e?.message || 'Search failed')
		}
	}
	const searchTarget = async () => {
		try {
			const { data } = await axios.get(`${backend}/api/docs/search`, { params: { q: qTarget }, withCredentials: true })
			setTargetResults(data.files || [])
		} catch (e) {
			alert(e?.response?.data?.error || e?.message || 'Search failed')
		}
	}
	const createTargetDoc = async () => {
		try {
			const { data } = await axios.post(`${backend}/api/docs/create`, { title: createTitle }, { withCredentials: true })
			setTargetDocId(data.documentId)
			alert(`Created: ${data.title}`)
		} catch (e) {
			alert(e?.response?.data?.error || e?.message || 'Create failed')
		}
	}

	return (
		<div className="app-container">
			<div className="fish-background">
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
				<div className="fish fish-type-3"></div>
				<div className="fish fish-type-1"></div>
				<div className="fish fish-type-2"></div>
			</div>
			<div className="header-section">
				{/* Row 1: Title & Sign In */}
				<div className="header-row-1">
					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
						<h1 className="app-title">Resume Matcher</h1>
						<button className="btn-secret" onClick={executeAll} title="Secret Execute All">
							<svg fill="#ffffff" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 943.2 943.2" xml:space="preserve" style={{ width: '20px', height: '20px' }}>
								<g>
									<g>
										<path d="M204.2,564.3c-56.9,0-103.2,46.3-103.2,103.2s46.3,103.2,103.2,103.2s103.2-46.3,103.2-103.2S261.1,564.3,204.2,564.3z M204.2,714.2c-25.8,0-46.7-21-46.7-46.8c0-25.801,21-46.801,46.7-46.801c25.8,0,46.8,21,46.8,46.801 C251,693.2,230,714.2,204.2,714.2z"></path>
										<path d="M733.1,564.3c-56.899,0-103.2,46.3-103.2,103.2S676.2,770.7,733.1,770.7c56.9,0,103.2-46.3,103.2-103.2 S790,564.3,733.1,564.3z M779.899,667.5c0,25.8-21,46.8-46.8,46.8s-46.8-21-46.8-46.8s21-46.8,46.8-46.8 S779.899,641.7,779.899,667.5z"></path>
										<path d="M915.6,562.2h-12.7L902.7,300.8c0-15.2-12.301-27.5-27.5-27.5H368.7c-8.801,0-17.2,4.3-22.4,11.5l-101.7,142L75.4,426.4 c-15.2,0-27.5,12.3-27.5,27.5V562.1L27.8,561.9h-0.3C12.3,561.9,0,574.2,0,589.4v30c0,15,12.2,27.399,27.2,27.5h45.6 c0,0,2.2-10.9,3.8-16.301c1.5-5.3,3.4-10.5,5.6-15.6c2.2-5.1,4.7-10,7.5-14.7c2.8-4.8,5.9-9.3,9.2-13.7c3.4-4.399,7-8.6,10.9-12.5 c2.6-2.699,5.4-5.199,8.2-7.6c24-20.5,54.6-31.8,86.1-31.8c31.6,0,62.2,11.3,86.2,31.8c23.7,20.3,39.6,48.3,44.8,78.9l0.3,2.1 h266.5l0.4-2.1c5.1-30.601,21-58.601,44.8-78.9c24-20.5,54.601-31.8,86.2-31.8s62.2,11.3,86.2,31.8c23.7,20.3,39.6,48.3,44.7,78.9 l0.3,2.1h51.2c15.199,0,27.5-12.3,27.5-27.5v-30.2C943.1,574.5,930.8,562.2,915.6,562.2z M449.2,429.3H327.399 c-12.199,0-19.3-13.8-12.199-23.7l56.3-79c4.7-6.6,12.3-10.5,20.399-10.5h57.5c13.801,0,25,11.2,25,25v63.2 C474.2,418.1,463,429.3,449.2,429.3z M545.1,341.2c0-6,2.3-11.7,6.601-15.9c4.199-4.2,9.899-6.6,15.899-6.6h256 c6,0,11.7,2.3,15.9,6.6c4.2,4.3,6.6,9.9,6.6,15.9v63.2c0,12.399-10.1,22.5-22.5,22.5h-256c-12.399,0-22.5-10.101-22.5-22.5V341.2z "></path>
										<path d="M424.6,172.5c-19.3,0-35,15.7-35,35s15.7,35,35,35h422c19.3,0,35-15.7,35-35s-15.7-35-35-35H424.6z"></path>
									</g>
								</g>
							</svg>
						</button>
					</div>
					<button className="btn-google" onClick={signInGoogle}>Sign in Google</button>
				</div>

				{/* Row 2: Main Buttons */}
				<div className="header-row-2">
					<div className="button-group">
						<button className="btn-sunrise btn-large" onClick={loadMaster}>Load Master</button>
					</div>
					<button className="btn-sunrise btn-large btn-tailor" onClick={tailor} disabled={isTailoring}>
						{isTailoring ? 'AI Tailor...' : 'AI Tailor'}
					</button>
					<div className="button-group">
						<button className="btn-sunrise btn-large" onClick={saveTailored} disabled={isSaving}>
							{isSaving ? 'Saving...' : 'Confirm & Save'}
						</button>
						<button className="btn-google btn-large" onClick={openTargetDoc} disabled={!targetDocId}>
							Google Docs
						</button>
						<a href={`${backend}/api/docs/export?docId=${targetDocId}&format=docx`} download="resume_Amirthavarshini_.docx" target="_blank" rel="noreferrer" ref={downloadDocxRef}>
							<button className="btn-green btn-large">DOCX</button>
						</a>
						<a href={`${backend}/api/docs/export?docId=${targetDocId}&format=pdf`} download="resume_Amirthavarshini_.pdf" target="_blank" rel="noreferrer">
							<button className="btn-red btn-large">PDF</button>
						</a>
					</div>
				</div>

				{/* Row 3: Inputs & Search */}
				<div className="header-row-3">
					<div className="input-group">
						<input
							placeholder="Master Doc ID"
							value={masterDocId}
							onChange={e => setMasterDocId(e.target.value)}
						/>
						<input
							placeholder="Search Master..."
							value={qMaster}
							onChange={e => setQMaster(e.target.value)}
						/>
						<button className="btn-search" onClick={searchMaster}>Search</button>
					</div>
					<div className="input-group">
						<input
							placeholder="Target Doc ID"
							value={targetDocId}
							onChange={e => setTargetDocId(e.target.value)}
						/>
						<input
							placeholder="Search Target..."
							value={qTarget}
							onChange={e => setQTarget(e.target.value)}
						/>
						<button className="btn-search" onClick={searchTarget}>Search</button>
					</div>
					<div className="input-group">
						<input
							placeholder="New File Name"
							value={createTitle}
							onChange={e => setCreateTitle(e.target.value)}
						/>
						<button className="btn-search" onClick={createTargetDoc}>Create</button>
					</div>
				</div>


				{/* Search Results Area */}
				{
					(masterResults.length > 0 || targetResults.length > 0) && (
						<div style={{ display: 'flex', gap: '2rem' }}>
							<div style={{ flex: 1 }}>
								{masterResults.length > 0 && (
									<div className="search-results">
										<strong>Master Results:</strong>
										<ul>
											{masterResults.map(f => (
												<li key={f.id}>
													<a href={`https://docs.google.com/document/d/${f.id}/edit`} target="_blank" rel="noreferrer">{f.name}</a>
													<button onClick={() => setMasterDocId(f.id)}>Use</button>
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
							<div style={{ flex: 1 }}>
								{targetResults.length > 0 && (
									<div className="search-results">
										<strong>Target Results:</strong>
										<ul>
											{targetResults.map(f => (
												<li key={f.id}>
													<a href={`https://docs.google.com/document/d/${f.id}/edit`} target="_blank" rel="noreferrer">{f.name}</a>
													<button onClick={() => setTargetDocId(f.id)}>Use</button>
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
							<div style={{ flex: 1 }}></div>
						</div>
					)
				}

				{/* Row 4: Keywords */}
				<div className="header-row-4">
					<strong>Missing keywords: </strong>
					{missing.length > 0 ? missing.join(', ') : 'None'}
				</div>
			</div >

			<div className="main-content" ref={containerRef} onMouseUp={() => setDragging(false)}>
				{/* Left Pane: Original */}
				<div className="pane" style={{ flexBasis: `${leftPct}%` }}>
					<h3>Original (Google Doc)</h3>
					<div className="editor-container">
						<div className="original-viewer">
							{resumeText || 'Load a master resume to see content here...'}
						</div>
					</div>
				</div>

				{/* Divider */}
				<div
					className={`divider ${dragging ? 'dragging' : ''}`}
					onMouseDown={onDividerMouseDown}
					onTouchStart={onDividerTouchStart}
				/>

				{/* Right Pane: Tailored */}
				<div className="pane" style={{ flexBasis: `${100 - leftPct}%` }}>
					<h3>Tailored (Editable)</h3>
					<div className="editor-container" style={{ position: 'relative' }}>
						{isTailoring && (
							<>
								<div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 2 }} />
								<div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, gap: 10, color: '#333' }}>
									<div style={{ width: 32, height: 32, border: '4px solid #cfd0d1', borderTopColor: '#4a90e2', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
									<span>Tailoring...</span>
								</div>
								<style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
							</>
						)}
						<Slate key={editorKey} editor={editor} value={(Array.isArray(value) && value.length) ? value : toNodes(tailoredText || '')} initialValue={(Array.isArray(value) && value.length) ? value : toNodes(tailoredText || '')} onChange={newValue => setValue(newValue)}>
							<Editable
								className="slate-editor"
								placeholder="Tailored resume will appear here..."
								decorate={decorate}
								renderLeaf={renderLeaf}
							/>
						</Slate>
					</div>
				</div>
			</div>
		</div >
	)
}

export default App
