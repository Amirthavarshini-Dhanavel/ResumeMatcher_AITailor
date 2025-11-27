var HIGH_SCANS_THRES = 4;

function now() {
   return Math.floor(new Date().getTime() / 1000);
}

function recordScan() {
   chrome.storage.local.get(["scans", "first_scan_time"], function (result) {
      if (result["scans"] == undefined) {
         chrome.storage.local.set({
            scans: 1,
            first_scan_time: now(),
            high_scan_thres: HIGH_SCANS_THRES,
         });
      } else {
         chrome.storage.local.set({ scans: result["scans"] + 1 });
         // alert("scans at " + result["scans"])
      }
   });
}

function maybeAskFeedback(feedbackFunc) {
   /*
	Ask for feedback by redirecting to feedback page ONLY IF
	1) they've scanned a lot of times
	*/
   chrome.storage.local.get(
      ["scans", "first_scan_time", "high_scan_thres"],
      function (result) {
         if (result["scans"] == undefined) {
            return;
         }
         // alert("thres is " + result["high_scan_thres"])

         var high_scans = result["scans"] >= result["high_scan_thres"];

         if (high_scans) {
            feedbackFunc();
         }
      }
   );
}

function handleNotNow(andThen) {
   /*
	1) bump the number of scans needed till next ask for feedback
	2) bump the time until next ask for feedback
	3) redirect to scan page
	*/
   chrome.storage.local.get(["scans"], function (result) {
      chrome.storage.local.set({ high_scan_thres: (result["scans"] - 1) * 4 });
      if (andThen != null) {
         andThen();
      } else {
         window.location.href = "/html/scanner.html";
      }
   });
}

function handleGiveFeedback(andThen) {
   /*
	1) turn scans to -1 trillion
	2) then invoke whatever else needs to happen
	*/
   chrome.storage.local.set({ scans: Number.MIN_SAFE_INTEGER });
   andThen();
}

export { recordScan, maybeAskFeedback, handleNotNow, handleGiveFeedback };
