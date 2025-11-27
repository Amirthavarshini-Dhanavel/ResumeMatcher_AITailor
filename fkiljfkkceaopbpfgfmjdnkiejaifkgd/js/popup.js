import { hasUploadedResume, sleep, getActiveTab } from "/js/util.js";
import { check_tab } from "/js/check_tab.js";

console.log("Hello from popup");
$(document).ready(function () {
   sleep(50).then(async () => {
      // sleep .05 seconds to wait for resumeData to get loaded
      console.log("Trying to change the hrecf");
      console.log(hasUploadedResume());
      if (hasUploadedResume()) {
         check_tab();
      } else {
         const tab = await getActiveTab();
         console.log("active tab", tab);
         window.location.href = "/html/full_page_uploader.html";
         // chrome.action.setPopup(
         //    { popup:, tabId: tab.id },
         //    (err) => {
         //       console.log(err);
         //       console.log("Popup changed");
         //    }
         // );
      }
   });
});
console.log("Hello from popup");
