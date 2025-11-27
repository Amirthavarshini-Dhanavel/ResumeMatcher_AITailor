import { handleNotNow, handleGiveFeedback } from "/js/feedback_utils.js";

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
      trackEvent("feedback_us_page_not_now", "click");
      handleNotNow();
   });

   $("#feedbackLink").click(function () {
      trackEvent("feedback_us_page_click_through", "click");
      handleGiveFeedback(goToFeedbackForm);
   });
});

function goToFeedbackForm() {
   chrome.tabs.create({
      active: true,
      url: "https://docs.google.com/forms/d/e/1FAIpQLSe2lMzT8PJTTEFNL5cow6tZk0Z78pIFT6nSGDMbuDhUjYOyyQ/viewform",
   });
}
