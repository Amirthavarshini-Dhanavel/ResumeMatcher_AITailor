import { handleNotNow, handleGiveFeedback } from "./feedback_utils.js";

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
$(document).ready(function () {
   $("#not_now").click(function () {
      trackEvent("review_us_page_not_now", "click");
      handleNotNow();
   });

   $("#reviewLink").click(function () {
      tracker.send("review_us_page_click_through", "click");
      handleGiveFeedback(goToReviewPage);
   });
});

function goToReviewPage() {
   var utm_params = "&utm_source=app&utm_medium=review_us";

   chrome.tabs.create({
      active: true,
      url:
         "http://chrome.google.com/webstore/detail/jobalytics-resume-keyword/fkiljfkkceaopbpfgfmjdnkiejaifkgd?hl=en" +
         utm_params,
   });
}
