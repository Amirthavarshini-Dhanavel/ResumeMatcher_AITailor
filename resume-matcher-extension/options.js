chrome.storage.local.get(["backend", "jm_id", "jie_id"], (v) => {
	const backend = document.getElementById("backend");
	const jm = document.getElementById("jm");
	const jie = document.getElementById("jie");
	backend.value = v.backend || "http://localhost:4000";
	jm.value = v.jm_id || "";
	jie.value = v.jie_id || "";
});

document.getElementById("save").onclick = () => {
	const backend = document.getElementById("backend").value;
	const jm = document.getElementById("jm").value;
	const jie = document.getElementById("jie").value;
	chrome.storage.local.set({ backend, jm_id: jm, jie_id: jie });
	alert("Saved");
};


