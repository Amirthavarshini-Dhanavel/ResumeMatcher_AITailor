var settings_on = true;
// window.dataLayer = window.dataLayer || [];
// function gtag() {
//    dataLayer.push(arguments);
// }
// // gtag("js", new Date());
// // gtag("config", "G-NB84M0TM7E");
// // console.log("Hello from create persistent score");

// function trackEvent(eventCategory, eventAction, eventURL) {
//    // gtag(
//    //    "event",
//    //    eventAction,
//    //    {
//    //       event_category: eventCategory,
//    //    },
//    //    (field) => console.log("call back data", field)
//    // );
// }
console.log("Create persistent score called");

function _text_from_class(class_name) {
   var divs = document.getElementsByClassName(class_name);
   if (divs.length == 0) {
      return "";
   }
   return divs[0].innerText.trim();
}

function _text_from_id(div_id) {
   var div = document.getElementById(div_id);
   if (div != null) {
      return div.innerText.trim();
   }
   return "";
}

function _indeed_employer_and_loc() {
   var divs = document.getElementsByClassName("jobsearch-InlineCompanyRating");
   if (divs.length > 0) {
      var subdivs = divs[0].children;
      // we expect title, stars, location
      if (subdivs.length == 3 || subdivs.length == 4) {
         return [
            subdivs[0].innerText.trim(),
            subdivs[subdivs.length - 1].innerText.trim(),
         ];
      } else {
         return ["", ""];
      }
   } else {
      return ["", ""];
   }
}

function get_job_title() {
   var page = get_supported_page();
   if (page == "indeed_job_search") {
      return _text_from_id("vjs-jobtitle");
   } else if (page == "indeed_job_view") {
      return _text_from_class("jobsearch-JobInfoHeader-title");
   } else if (page == "linkedin_job_search") {
      var loggedin_title = _text_from_class("jobs-details-top-card__job-title");
      if (loggedin_title != "") {
         return loggedin_title;
      }

      try {
         var details = document.getElementsByClassName(
            "details-pane__content"
         )[0];
         return details.getElementsByClassName("topcard__title")[0].textContent;
      } catch (err) {
         return "";
      }
   } else if (page == "linkedin_job_view") {
      return _text_from_class("jobs-top-card__job-title");
   } else if (page == "myworkday_job_view") {
      return _text_from_id("richTextArea.jobPosting.title-input");
   } else {
      return "";
   }
}

function get_job_employer() {
   var page = get_supported_page();
   if (page == "indeed_job_search") {
      return _text_from_id("vjs-cn");
   } else if (page == "indeed_job_view") {
      return _indeed_employer_and_loc()[0];
   } else if (page == "linkedin_job_search") {
      var loggedin_employer = _text_from_class(
         "jobs-details-top-card__company-url"
      );
      if (loggedin_employer != "") {
         return loggedin_employer;
      }

      try {
         var details = document.getElementsByClassName(
            "details-pane__content"
         )[0];
         return details.getElementsByClassName("topcard__flavor")[0]
            .textContent;
      } catch (err) {
         return "";
      }
   } else if (page == "linkedin_job_view") {
      return _text_from_class("jobs-top-card__company-url");
   } else if (page == "myworkday_job_view") {
      var url = new URL(window.location.href);
      return url.hostname.substr(0, url.hostname.indexOf("."));
   } else {
      return "";
   }
}

function get_job_location() {
   var page = get_supported_page();
   if (page == "indeed_job_search") {
      var text = _text_from_id("vjs-loc");
      if (text != "") {
         var letterMatch = text.match(/[a-zA-Z]/);
         if (letterMatch) {
            return text.substring(letterMatch["index"]);
         } else {
            return text;
         }
      }
      return "";
   } else if (page == "indeed_job_view") {
      return _indeed_employer_and_loc()[1];
   } else if (page == "linkedin_job_search") {
      var loggedin_location = _text_from_class("jobs-details-top-card__bullet");
      if (loggedin_location == "") {
         loggedin_location = _text_from_class(
            "jobs-details-top-card__exact-location"
         );
      }

      if (loggedin_location != "") {
         return loggedin_location;
      }

      try {
         var details = document.getElementsByClassName(
            "details-pane__content"
         )[0];
         return details.getElementsByClassName("topcard__flavor")[1]
            .textContent;
      } catch (err) {
         return "";
      }
   } else if (page == "linkedin_job_view") {
      var tryText = _text_from_class("jobs-top-card__bullet");
      if (tryText == "") {
         tryText = _text_from_class("jobs-top-card__exact-location");
      }
      return tryText;
   } else if (page == "myworkday_job_view") {
      return _text_from_id("labeledImage.LOCATION");
   } else {
      return "";
   }
}

function get_job_text() {
   var crawl_result = crawl_elm_blind(get_job_descr_elm());
   var flattened = "";
   for (const text of crawl_result["saved"]) {
      if (text.trim() != "") {
         flattened += text + "\n";
      }
   }
   return flattened;
}
var resumeData = "";

function get_job_url() {
   var page = get_supported_page();
   if (page != "linkedin_job_search") {
      return window.location.href;
   } else {
      if (window.location.href.toLowerCase().includes("jobid")) {
         return window.location.href;
      } else {
         // we suspect this is the first result with no jobId in url, so look for it
         // in the div itself.
         var search_results =
            document.getElementsByClassName("job-card-search");
         if (search_results.length == 0) {
            return "";
         }
         var first_result = search_results[0];
         if (
            "jobId" in first_result.dataset &&
            first_result.dataset["jobId"].includes("jobPosting:")
         ) {
            // expected format is something like "urn:li:fs_normalized_jobPosting:1607805252"
            var job_id = first_result.dataset["jobId"].split("jobPosting:")[1];

            return "https://www.linkedin.com/jobs/view/" + job_id;
         }
         return "";
      }
   }
}

function loadResumeData(cb) {
   console.log("load resume called");

   chrome.storage.local
      .get(["resume"])
      .then((result) => {
         console.log("result of load resume", result);
         if (result["resume"] != undefined) {
            resumeData = result.resume;
            cb(resumeData);
         }
      })
      .catch((err) => {
         console.log("Error: ", err);
      });
}

function populateResumedata() {
   loadResumeData(function (value) {
      resumeData = value;
   });
}

function chromeEventSaveJob(job) {
   var job_title = get_job_title();
   var job_loc = get_job_location();
   var job_employer = get_job_employer();
   var job_url = get_job_url();

   var msg = {
      action: "save_job",
      url: job_url,
      job_title: job_title,
      job_loc: job_loc,
      job_employer: job_employer,
      source: get_supported_page(),
   };

   // console.log(msg)
   msg["job"] = job;

   chrome.runtime.sendMessage(msg);
}

async function save_job_and_maybe_create_persistent_score() {
   console.log("save job and maybe create score called");
   const util_src = chrome.runtime.getURL("/js/util.js");
   console.log("util src", util_src);
   const util = await import(util_src);
   console.log("util ", util);

   function get_match_score(job_text, resume_text) {
      var url = new URL(window.location.href);
      return util.get_match_result(url, resume_text, job_text)["score"];
   }

   var jobText = "";
   var target_elm = get_job_descr_elm();
   console.log("target_elm", target_elm);
   if (target_elm != null) {
      jobText = get_job_text();

      // console.log('get_job_text is ' + jobText)
   }
   console.log("job text ", jobText);
   console.log("resume data", resumeData);

   if (jobText != "" && resumeData != "") {
      // console.log("we will add a persistent score to this page!!")

      var score = get_match_score(jobText, resumeData);
      console.log("my score", score);
      if (
         get_supported_page() === "indeed_job_view" &&
         document.getElementsByClassName("jobsearch-JobDescriptionSection")[0]
      ) {
         target_elm = document.getElementsByClassName(
            "jobsearch-JobDescriptionSection"
         )[0];
      }
      util.httpGetAsync(
         chrome.runtime.getURL("/html/persistent_score.html"),
         function (data) {
            if (
               document.getElementsByClassName("persistent-image").length == 0
            ) {
               var fake_div = document.createElement("div");
               fake_div.innerHTML = data;
               target_elm.insertBefore(
                  fake_div.firstElementChild,
                  target_elm.firstChild
               );
               score_str = Math.round(score * 100) + "%";
               console.log("score string", score_str);
               if (
                  document.getElementById("match_score") != null
                  // window.location.hostname !== "www.indeed.com"
               ) {
                  document.getElementById("match_score").innerHTML = score_str;
               } else if (get_supported_page() === "indeed_job_view") {
                  document.getElementById("match_score").innerHTML = score_str;
                  var styles = `

                    div.persistent-image {
                        white-space: normal !important;
                        background-color: #3A76BB;
                        border: #3A76BB 2px solid;
                        border-radius: 15px;
                        width: 450px;
                        height: 94px;
                        background-position: center;
                        background-repeat: no-repeat;
                        background-size: cover;
                        text-align: left;
                        margin-bottom: 15px;
                        margin-left: auto;
                        margin-right: auto;
                      }

                      div.persistent-image:before {
                        content: "";
                        display: inline-block;
                        vertical-align: middle;
                        height: 100%;
                      }

                      div.heightless_text_container_percentage {
                        width: 150px;
                        text-align: center;
                        display: inline-block;
                        margin-left: 0px;
                        position: relative;
                        line-height: 0.8;
                        vertical-align: middle;
                      }

                      div.heightless_text_container_jobalytic {
                        width: 145px;
                        display: inline-block;
                        position: relative;
                        margin-left: 10px;
                        vertical-align: middle;
                      }

                      .jobalytics_text {
                        font-size: 14px;
                        text-align: left;
                        color: #fff;
                        display: inline-block;
                        font-family: Avenir, -apple-system,system-ui,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Fira Sans,Ubuntu,Oxygen,Oxygen Sans,Cantarell,Droid Sans,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Lucida Grande,Helvetica,Arial,sans-serif !important;
                        font-weight: 600 !important;
                        font-style: normal;
                      }

                      html body.miniRefresh .jobalytics_text,
                      html body.miniRefresh .jobalytics_text_keyword,
                      html body.miniRefresh .lightning-image,
                      html body.miniRefresh .persistent-image,
                      html body.miniRefresh .persistent-image *,
                      html body.miniRefresh .jobalytics_tooltiptext {
                        font-family: Avenir, -apple-system,system-ui,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Fira Sans,Ubuntu,Oxygen,Oxygen Sans,Cantarell,Droid Sans,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Lucida Grande,Helvetica,Arial,sans-serif !important;
                        -webkit-font-smoothing: antialiased;
                      }

                      html body.miniRefresh #match_score {
                        font-family: -apple-system,system-ui,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Fira Sans,Ubuntu,Oxygen,Oxygen Sans,Cantarell,Droid Sans,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Lucida Grande,Helvetica,Arial,sans-serif !important;
                      }

                      .jobalytics_text_white {
                        color: white;
                        text-decoration-color:white;
                      }

                      .jobalytics_text_big {
                        font-size: 35px;
                        margin-top: 10px;
                        text-align: center;
                      }

                      .jobalytics_text_keyword {
                          text-align: center;
                          margin-top: 10px;
                          color: #fff;
                          display: inline;
                          font-size: 14px;
                          font-family: Avenir, -apple-system,system-ui,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Fira Sans,Ubuntu,Oxygen,Oxygen Sans,Cantarell,Droid Sans,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Lucida Grande,Helvetica,Arial,sans-serif;
                          font-weight: 600;
                          font-style: normal;
                      }

                      .lightning-image {
                        background-image: url(${chrome.runtime.getURL(
                           "images/lightning.png"
                        )});
                        background-size: contain;
                        background-position: center center;
                        background-repeat: no-repeat;
                        text-align: center;
                        width: 85px;
                        height: 85px;
                        display: inline-block;
                        float: right;
                        margin-right: 24px;
                      }

                      div.where_is_extension_img {
                        background-image: url(${chrome.runtime.getURL(
                           "images/where_is_extension.png"
                        )});
                        width: 150px;
                        height: 150px;
                        background-size: cover;
                        text-align: center;
                        background-position: center center;
                        background-repeat: no-repeat;
                      }

                      /* Tooltip container */
                      .jobalytics_tooltip {
                        position: relative;
                        display: inline-block;
                      }

                      /* Tooltip text */
                      .jobalytics_tooltip .jobalytics_tooltiptext {
                        visibility: hidden;
                        width: 200px;
                        background-color: rgb(255, 255, 255);
                        color: black !important;
                        text-align: center;
                        position: absolute;
                        z-index: 1;
                        border-width: 3px;
                        border-style: solid;
                        border-color: rgb(58, 118, 187);
                        border-image: initial;
                        padding: 10px 5px 5px;
                        border-radius: 6px;
                      }

                      .jobalytics_tooltip .jobalytics_tooltiptext_1 {
                        width: 184px;
                      }

                      /* Show the tooltip text when you mouse over the tooltip container */
                      .jobalytics_tooltip:hover .jobalytics_tooltiptext {
                        visibility: visible;
                        line-height: 1.2;
                      }

                      #match_score {
                        font-size: 45px;
                        font-weight: 400;
                        color: #fff;
                        -webkit-font-smoothing: antialiased;
                      }
                    `;
                  var styleSheet = document.createElement("style");
                  styleSheet.innerText = styles;
                  document.head.appendChild(styleSheet);
               } else {
                  var iframe = document.getElementById("vjs-container-iframe");
                  if (iframe) {
                     iframe.contentWindow.document.getElementById(
                        "match_score"
                     ).innerHTML = score_str;
                  }
                  var styles = `
                    div.persistent-image {
                        white-space: normal !important;
                        background-color: #3A76BB;
                        border: #3A76BB 2px solid;
                        border-radius: 15px;
                        width: 450px;
                        height: 94px;
                        background-position: center;
                        background-repeat: no-repeat;
                        background-size: cover;
                        text-align: left;
                        margin-bottom: 15px;
                        margin-left: auto;
                        margin-right: auto;
                      }

                      div.persistent-image:before {
                        content: "";
                        display: inline-block;
                        vertical-align: middle;
                        height: 100%;
                      }

                      div.heightless_text_container_percentage {
                        width: 150px;
                        text-align: center;
                        display: inline-block;
                        margin-left: 0px;
                        position: relative;
                        line-height: 0.8;
                        vertical-align: middle;
                      }

                      div.heightless_text_container_jobalytic {
                        width: 145px;
                        display: inline-block;
                        position: relative;
                        margin-left: 10px;
                        vertical-align: middle;
                      }

                      .jobalytics_text {
                        font-size: 14px;
                        text-align: left;
                        color: #fff;
                        display: inline-block;
                        font-family: Avenir, -apple-system,system-ui,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Fira Sans,Ubuntu,Oxygen,Oxygen Sans,Cantarell,Droid Sans,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Lucida Grande,Helvetica,Arial,sans-serif !important;
                        font-weight: 600 !important;
                        font-style: normal;
                      }

                      html body.miniRefresh .jobalytics_text,
                      html body.miniRefresh .jobalytics_text_keyword,
                      html body.miniRefresh .lightning-image,
                      html body.miniRefresh .persistent-image,
                      html body.miniRefresh .persistent-image *,
                      html body.miniRefresh .jobalytics_tooltiptext {
                        font-family: Avenir, -apple-system,system-ui,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Fira Sans,Ubuntu,Oxygen,Oxygen Sans,Cantarell,Droid Sans,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Lucida Grande,Helvetica,Arial,sans-serif !important;
                        -webkit-font-smoothing: antialiased;
                      }

                      html body.miniRefresh #match_score {
                        font-family: -apple-system,system-ui,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Fira Sans,Ubuntu,Oxygen,Oxygen Sans,Cantarell,Droid Sans,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Lucida Grande,Helvetica,Arial,sans-serif !important;
                      }

                      .jobalytics_text_white {
                        color: white;
                        text-decoration-color:white;
                      }

                      .jobalytics_text_big {
                        font-size: 35px;
                        margin-top: 10px;
                        text-align: center;
                      }

                      .jobalytics_text_keyword {
                          text-align: center;
                          margin-top: 10px;
                          color: #fff;
                          display: inline;
                          font-size: 14px;
                          font-family: Avenir, -apple-system,system-ui,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Fira Sans,Ubuntu,Oxygen,Oxygen Sans,Cantarell,Droid Sans,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Lucida Grande,Helvetica,Arial,sans-serif;
                          font-weight: 600;
                          font-style: normal;
                      }

                      .lightning-image {
                        background-image: url(${chrome.runtime.getURL(
                           "images/lightning.png"
                        )});
                        background-size: contain;
                        background-position: center center;
                        background-repeat: no-repeat;
                        text-align: center;
                        width: 85px;
                        height: 85px;
                        display: inline-block;
                        float: right;
                        margin-right: 24px;
                      }

                      div.where_is_extension_img {
                        background-image: url(${chrome.runtime.getURL(
                           "images/where_is_extension.png"
                        )});
                        width: 150px;
                        height: 150px;
                        background-size: cover;
                        text-align: center;
                        background-position: center center;
                        background-repeat: no-repeat;
                      }

                      /* Tooltip container */
                      .jobalytics_tooltip {
                        position: relative;
                        display: inline-block;
                      }

                      /* Tooltip text */
                      .jobalytics_tooltip .jobalytics_tooltiptext {
                        visibility: hidden;
                        width: 184px;
                        background-color: rgb(255, 255, 255);
                        color: black !important;
                        text-align: center;
                        position: absolute;
                        z-index: 1;
                        border-width: 3px;
                        border-style: solid;
                        border-color: rgb(58, 118, 187);
                        border-image: initial;
                        padding: 10px 5px 5px;
                        border-radius: 6px;
                      }

                      /* Show the tooltip text when you mouse over the tooltip container */
                      .jobalytics_tooltip:hover .jobalytics_tooltiptext {
                        visibility: visible;
                        line-height: 1.2;
                      }

                      #match_score {
                        font-size: 45px;
                        font-weight: 400;
                        color: #fff;
                        -webkit-font-smoothing: antialiased;
                      }
                    `;
                  if (iframe) {
                     var styleSheet = document?.createElement("style");
                     styleSheet.innerText = styles;
                     iframe.contentWindow.document.head.appendChild(styleSheet);
                  }
               }
            } else {
               score_str = Math.round(score * 100) + "%";
               document.getElementById("match_score").innerHTML = score_str;
            }

            // trackEvent("persistent_score", "created");

            // util.save_match_score_for_job_recs(score);
         }
      );
   } else {
      // console.log("we will NOT add a persistent score to this page")
   }

   if (jobText != "") {
      chromeEventSaveJob(jobText);
   }
}

if (settings_on) {
   populateResumedata();
}

var url = new URL(window.location.href);

if (url.hostname == "www.linkedin.com" && url.pathname == "/jobs/search/") {
   if (
      document.getElementsByClassName("persistent-image").length != 0 &&
      document.getElementById("job-details") != null
   ) {
      var target_elm = document.getElementById("job-details");
      target_elm.removeChild(target_elm.childNodes[0]);
      setTimeout(() => {
         save_job_and_maybe_create_persistent_score();
      }, 500);
   } else {
      setTimeout(() => {
         save_job_and_maybe_create_persistent_score();
      }, 1000);
   }
} else if (url.hostname.endsWith("myworkdayjobs.com")) {
   setTimeout(() => {
      save_job_and_maybe_create_persistent_score();
   }, 1000);
} else {
   setTimeout(() => {
      save_job_and_maybe_create_persistent_score();
   }, 1000);
}
