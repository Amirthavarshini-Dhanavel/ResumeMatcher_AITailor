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
   var persistent_score_on = true;
   var $input = $("#input_checkbox");

   chrome.storage.local.get(["persistent_score_on_key"], function (result) {
      // show settings
      $("#loading").css("display", "none");
      $("#settings_checkboxes").css("display", "inline-block");

      // alert(result['persistent_score_on_key']);
      if (result["persistent_score_on_key"] != false) {
         $input.prop("checked", true);
      } else {
         $input.prop("checked", false);
      }
   });

   $("input").click(function () {
      if ($input.prop("checked")) {
         trackEvent("toggle_persistent_score_setting", "on");
         chrome.storage.local.set(
            { persistent_score_on_key: true },
            function () {
               console.log("changed to true");
            }
         );
      } else {
         trackEvent("toggle_persistent_score_setting", "off");
         chrome.storage.local.set(
            { persistent_score_on_key: false },
            function () {
               console.log("changed to false");
            }
         );
      }
   });
});
