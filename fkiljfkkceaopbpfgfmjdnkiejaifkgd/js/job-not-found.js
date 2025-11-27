// add the Indeed and LinkedIn redirect links
document.addEventListener("DOMContentLoaded", function () {
   addLinkedInLink();
   addIndeedLink();
   addGlassdoorLink();
   // Google Analytics Could Not Scan Event
   couldNotScan();
});

function addLinkedInLink() {
   document
      .getElementById("linkedinLink")
      .addEventListener("click", function () {
         chrome.tabs.create({
            active: true,
            url: "https://www.linkedin.com/jobs/",
         });
      });
}

function addIndeedLink() {
   document.getElementById("indeedLink").addEventListener("click", function () {
      chrome.tabs.create({ active: true, url: "https://indeed.com" });
   });
}

function addGlassdoorLink() {
   document
      .getElementById("glassdoorLink")
      .addEventListener("click", function () {
         chrome.tabs.create({
            active: true,
            url: "https://www.glassdoor.com/",
         });
      });
}

// Google Analytics Could Not Scan Event
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
function couldNotScan() {
   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var url = new URL(tabs[0].url);
      trackEvent("could_not_scan", "click", url);
      save_tab(url.toString());
   });
}
