async function getActiveTabId() {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	return tab?.id;
}

document.getElementById("preview").onclick = async () => {
	const cfg = await chrome.storage.local.get(["backend", "jm_id", "jie_id"]);
	if (!cfg.jie_id) {
		document.getElementById("msg").textContent = "Job Extractor ID not set in Options";
		return;
	}
	const active = await getActiveTabId();
	chrome.runtime.sendMessage(cfg.jie_id, { type: "jie_extract_job", tabId: active }, (res) => {
		if (!res || res.error) {
			document.getElementById("msg").textContent = `Preview failed: ${res?.error || 'unknown error'}`;
			return;
		}
		const t = res.title || '(no title)';
	const c = res.company || '(no company)';
	const u = res.url || '(no url)';
	document.getElementById("msg").textContent = `Title: ${t} | Company: ${c} | URL: ${u}`;
	});
};

document.getElementById("save").onclick = async () => {
	const cfg = await chrome.storage.local.get(["backend", "jm_id", "jie_id"]);
	const active = await getActiveTabId();
	if (!cfg.jie_id) {
		document.getElementById("msg").textContent = "Job Extractor ID not set in Options";
		return;
	}
	try {
		chrome.runtime.sendMessage(cfg.jie_id, { type: "jie_save_to_sheet", tabId: active }, (res) => {
			document.getElementById("msg").textContent = res?.ok ? "Saved to sheet" : (res?.error || "Save failed");
		});
	} catch (e) {
		document.getElementById("msg").textContent = "Cannot reach Job Extractor extension";
	}
};

document.getElementById("match").onclick = async () => {
	const cfg = await chrome.storage.local.get(["backend", "jm_id", "jie_id"]);
	console.log("[RM-Orch] match clicked; cfg:", cfg);
	if (!cfg.jm_id) {
		document.getElementById("msg").textContent = "Jobalytics ID not set in Options";
		return;
	}
	const active = await getActiveTabId();
	// Get job text from current tab
	let jobText = "";
	let jobUrl = "";
	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		jobUrl = tab?.url || "";
		const results = await chrome.scripting.executeScript({
			target: { tabId: active, allFrames: true },
			func: () => (document && document.body ? document.body.innerText : ""),
		});
		jobText = (results || []).map(r => (r && typeof r.result === "string" ? r.result : "")).join("\n");
		console.log("[RM-Orch] captured jobUrl:", jobUrl, "jobText.length:", jobText?.length || 0);
	} catch (e) {
		console.warn("[RM-Orch] failed to capture job text:", e);
	}

	// Primary: ask Jobalytics to scan and compute fresh keywords
	chrome.runtime.sendMessage(cfg.jm_id, { type: "jm_scan_and_get_keywords", tabId: active }, async (res) => {
		const lastErr = chrome.runtime.lastError;
		if (lastErr) {
			console.warn("[RM-Orch] jm_scan_and_get_keywords lastError:", lastErr);
		}
		console.log("[RM-Orch] jm_scan_and_get_keywords response:", res);

		// Fallback to reading stored keywords if scan failed/empty
		const needFallback =
			lastErr ||
			!res ||
			res.error ||
			((Array.isArray(res.matches) ? res.matches.length : 0) === 0 &&
			 (Array.isArray(res.unmatches) ? res.unmatches.length : 0) === 0);

		if (needFallback) {
			console.log("[RM-Orch] falling back to jm_get_keywords");
			chrome.runtime.sendMessage(cfg.jm_id, { type: "jm_get_keywords" }, async (res2) => {
				const lastErr2 = chrome.runtime.lastError;
				if (lastErr2) console.warn("[RM-Orch] jm_get_keywords lastError:", lastErr2);
				console.log("[RM-Orch] jm_get_keywords response:", res2);
				const payload = Object.assign({ jobText, jobUrl }, (res2 || {}));
				// Also pass a compact rm param (unmatches + jobUrl) via URL for resilience
				const rm = { unmatches: Array.isArray(payload.unmatches) ? payload.unmatches : [], jobUrl: jobUrl || payload.jobUrl || "" };
				const rmParam = encodeURIComponent(btoa(JSON.stringify(rm)));
				const url = `http://localhost:5173/tailor?rm=${rmParam}`;
				const tab = await chrome.tabs.create({ url });
				chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
					if (tabId === tab.id && info.status === "complete") {
						chrome.tabs.onUpdated.removeListener(listener);
						chrome.scripting.executeScript({
							target: { tabId: tab.id },
							func: (payload) => {
								try { sessionStorage.setItem("rm_payload", JSON.stringify(payload)); } catch (e) {}
								window.postMessage({ type: "rm_payload", payload }, "*");
							},
							args: [payload],
						}).then(() => console.log("[RM-Orch] posted fallback payload to tailor page"));
					}
				});
			});
			return;
		}

		// Normal path: use fresh scan result
		const payload = Object.assign({ jobText, jobUrl }, (res || {}));
		// Also pass a compact rm param (unmatches + jobUrl) via URL for resilience
		const rm = { unmatches: Array.isArray(payload.unmatches) ? payload.unmatches : [], jobUrl: jobUrl || payload.jobUrl || "" };
		const rmParam = encodeURIComponent(btoa(JSON.stringify(rm)));
		const url = `http://localhost:5173/tailor?rm=${rmParam}`;
		const tab = await chrome.tabs.create({ url });
		chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
			if (tabId === tab.id && info.status === "complete") {
				chrome.tabs.onUpdated.removeListener(listener);
				chrome.scripting.executeScript({
					target: { tabId: tab.id },
					func: (payload) => {
						try { sessionStorage.setItem("rm_payload", JSON.stringify(payload)); } catch (e) {}
						window.postMessage({ type: "rm_payload", payload }, "*");
					},
					args: [payload],
				}).then(() => console.log("[RM-Orch] posted payload to tailor page"));
			}
		});
	});
};


