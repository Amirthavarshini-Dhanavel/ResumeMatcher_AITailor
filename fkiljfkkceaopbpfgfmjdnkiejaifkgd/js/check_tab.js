import {
   getResumeString,
   waitForPageSourceThenScan,
   runGetPageSource,
} from "/js/util.js";

import { recordScan, maybeAskFeedback } from "/js/feedback_utils.js";

window.dataLayer = window.dataLayer || [];
function gtag() {
   dataLayer.push(arguments);
}
gtag("js", new Date());
gtag("config", "G-NB84M0TM7E");

function trackEvent(eventCategory, eventAction, eventURL) {
   gtag(
      "event",
      eventAction,
      {
         event_category: eventCategory,
      },

      (field) => console.log("call back data", field)
   );
}
function save_tab(url) {
   chrome.storage.local.set({ jobalytics_data: url }, function () {
      // console.log('set up success');
   });
   chrome.storage.local.set({ scan_yet: true }, function () {});
}

function check_tab() {
   console.log("check tab called");
   var url;
   chrome.tabs.query(
      { active: true, lastFocusedWindow: true },
      function (tabs) {
         url = tabs[0].url;
         // console.log(url);
      }
   );
   chrome.storage.local.get(["jobalytics_data", "scan_yet"], function (result) {
      // console.log(result.jobalytics_data);
      // console.log(result.scan_yet);
      console.log("Local storage result", result);
      if (result.jobalytics_data == url && result.scan_yet) {
         url = new URL(url);
         trackEvent("scan_job_desc", "click", url.hostname + url.pathname);
         recordScan();
         waitForPageSourceThenScan();
         runGetPageSource();
         console.log("Inside if cond");
      } else {
         window.location.href = "/html/scanner.html";
      }
   });
}

export { save_tab, check_tab };
