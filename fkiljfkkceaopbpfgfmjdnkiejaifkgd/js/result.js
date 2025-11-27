import { pdfParser, docxParser } from "/js/parser.js";
import { synonyms } from "/keywords/synonyms_list.js";
import { handleNotNow, maybeAskFeedback } from "/js/feedback_utils.js";
import {
   save_match_score_for_job_recs,
   default_to,
   with_uuid,
} from "/js/util.js";
import { getActiveTab } from "./util.js";

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
// Standard Google Universal Analytics code
(function (i, s, o, g, r, a, m) {
   i["GoogleAnalyticsObject"] = r;
   (i[r] =
      i[r] ||
      function () {
         (i[r].q = i[r].q || []).push(arguments);
      }),
      (i[r].l = 1 * new Date());
   (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
   a.async = 1;
   a.src = g;
   m.parentNode.insertBefore(a, m);
})(window, document, "script", "/assets/vendor/analytics.js", "ga"); // Note: https protocol here

ga("create", "UA-145698314-2", "auto"); // Enter your GA identifier
ga("set", "checkProtocolTask", function () {}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga("require", "displayfeatures");
ga("require", "ecommerce");

document.addEventListener(
   "DOMContentLoaded",
   function () {
      trackEvent("results_page", "view");

      maybeAskFeedback(activateFeedback);
      handleFeedbackBox();
      maybeDisplayJobRec();

      //var debug_printer = new DebugPrinter();
      var resumeData = "";
      var resumeFilename = "";

      chrome.storage.local.get(["resume"], function (result) {
         if (result["resume"] != undefined) {
            resumeData = result["resume"];
         }
      });

      function displayResult() {
         // einstein's working upload functionality goes here

         if (resumeData != "") {
            chrome.storage.local.set({ resume: resumeData }, function () {});
            chrome.storage.local.set(
               { filename: resumeFilename },
               function () {}
            );

            var text = "";

            chrome.storage.local.get(["resume"], function (result) {
               text = result["resume"];
               if (text != undefined) {
                  window.location.href = "/html/scanner.html";
               }
            });
         } else {
            alert("error uploading resume. Please choose a docx or pdf file");
         }
      }
      var decoded_url = getUrlParam(
         "http://www.hi.com/" + window.location.href
      );
      var matches = decoded_url["matches"].sort().reverse();
      var unmatches = decoded_url["unmatches"].sort().reverse();
      var score = decoded_url["score"] * 100;
      var score = Math.round(score);
      // Persist latest results for orchestrator consumption
      (async () => {
         try {
            const activeTab = await getActiveTab().catch(() => null);
            const jobUrl = (activeTab && activeTab.url) ? activeTab.url : "";
            chrome.storage.local.set({ matches, unmatches, score, last_url: jobUrl });
         } catch (e) {}
      })();
      // 01.05.20 Marked by Jacky - Restyle result page
      var keywordmatchicon =
         "<img src='/images/keywordmatches.png' style ='width=15px; height:15px; margin-right:10px;'>";
      var keywordmissingicon =
         "<img src='/images/keywordmissing.png' style ='width=15px; height:15px; margin-right:10px;'>";

      //function to show the entire match keyword list after item 5
      function matchesEntireList() {
         for (var i = 5; i < matches.length; i++) {
            var text = keywordmatchicon + matches[i];
            var wordH = $('<span class="text_big result_row"></span>').html(
               text
            );
            $("#match_keyword").before(wordH);
         }
         document.getElementById("match_show_more").innerHTML = "";
      }

      //function to show the entire unmatch keyword list after item 5
      function unmatchesEntireList() {
         for (var i = 5; i < unmatches.length; i++) {
            var text = keywordmissingicon + unmatches[i];
            var wordNh = $('<span class="text_big result_row"></span>').html(
               text
            );
            $("#unmatch_keyword").before(wordNh);
         }
         document.getElementById("unmatch_show_more").innerHTML = "";
      }

      if (matches.length == 0 && unmatches.length == 0 && isNaN(score)) {
         window.alert(
            "Error detecting job description on the current webpage... Please try on another job post :("
         );
      }
      if (matches.length > 5) {
         var shorterMatchList = matches.slice(0, 5);
         for (var i = 0; i < shorterMatchList.length; i++) {
            var text = keywordmatchicon + shorterMatchList[i];
            var wordH = $('<span class="text_big result_row"></span>').html(
               text
            );
            $("#match_keyword").before(wordH);
         }
         document.getElementById("match_show_more").innerHTML = "show more";
         document
            .getElementById("match_show_more")
            .addEventListener("click", matchesEntireList);
      } else {
         for (var i = 0; i < matches.length; i++) {
            var text = keywordmatchicon + matches[i];
            var wordH = $('<span class="text_big result_row"></span>').html(
               text
            );
            $("#match_keyword").before(wordH);
         }
      }
      if (unmatches.length > 5) {
         var shorterUnmatchList = unmatches.slice(0, 5);
         for (var i = 0; i < shorterUnmatchList.length; i++) {
            var text = keywordmissingicon + shorterUnmatchList[i];
            var wordNh = $('<span class="text_big result_row"></span>').html(
               text
            );
            $("#unmatch_keyword").before(wordNh);
         }
         document.getElementById("unmatch_show_more").innerHTML = "show more";
         document
            .getElementById("unmatch_show_more")
            .addEventListener("click", unmatchesEntireList);
      } else {
         for (var i = 0; i < unmatches.length; i++) {
            var text = keywordmissingicon + unmatches[i];
            var wordNh = $('<span class="text_big result_row"></span>').html(
               text
            );
            $("#unmatch_keyword").before(wordNh);
         }
      }

      $("#score").text(score);

      $("#reupload").click(function () {
         chrome.storage.local.set({ scan_yet: false }, function () {}); //turn into not scan
         trackEvent("resume_upload", "click");
      });
      $("#reupload").on("change", function (evt) {
         var file = evt.target.files[0];
         //console.log(file.split('.'))
         var ext = file.name.split(".").pop();
         resumeFilename = file.name;
         //debug_printer.log("input file is: " + String(file))
         if (ext == "pdf") {
            //debug_printer.log("detected pdf")
            //Read the file using file reader
            var fileReader = new FileReader();

            fileReader.onload = function () {
               //debug_printer.log("pdf file content loaded")

               //Turn array buffer into typed array
               var typedarray = new Uint8Array(this.result);

               //calling function to read from pdf file
               pdfParser(typedarray).then(
                  function (text) {
                     //debug_printer.log("pdf file parsed, resume data is now: " + resumeData.substring(0, 20) + "...")

                     /*Selected pdf file content is in the variable text. */

                     console.log("Text from uploaded", text);

                     // navigator.clipboard.writeText(text);
                     resumeData = text;

                     displayResult();
                  },
                  function (
                     reason //Execute only when there is some error while reading pdf file
                  ) {
                     alert(
                        "Seems this file is broken, please upload another file"
                     );
                  }
               );
            };

            //debug_printer.log("starting to read pdf file")
            //Read the file as ArrayBuffer
            fileReader.readAsArrayBuffer(file);
         } else if (ext == "docx") {
            //debug_printer.log("docx file detected")
            //Csongor's code goes here
            function setResumeData(result) {
               //debug_printer.log("done parsing docx file")
               var myResume = result.value;
               chrome.storage.local.set({ resume: myResume }, function () {});
               chrome.storage.local.get("resume", function (obj) {
                  //resumeData = obj.resume;
                  //debug_printer.log("resumeData is now: " + resumeData.substring(0, 20) + "...")
               });
               resumeData = myResume;
               displayResult();
            }

            docxParser(setResumeData);
         } else {
            alert("Please only upload pdf or docx");
         }
      });

      highlightKeywords(matches, unmatches);

      save_match_score_for_job_recs(score / 100.0);
   },
   false
);

function getUrlParam(url) {
   var get_url = new URL(url);
   var matches = JSON.parse(get_url.searchParams.get("matches"));
   var unmatches = JSON.parse(get_url.searchParams.get("unmatches"));
   var score = get_url.searchParams.get("score");

   var dict = {};
   dict["matches"] = matches;
   dict["unmatches"] = unmatches;
   dict["score"] = score;

   return dict;
}

async function highlightKeywords(matches, unmatches) {
   const activeTab = await getActiveTab();
   const tabId = activeTab.id;
   chrome.scripting
      .executeScript({
         target: { tabId, allFrames: true },
         files: ["/js/crawler.js"],
      })
      .then(() => {
         chrome.scripting
            .executeScript({
               target: { tabId, allFrames: true },
               files: ["/js/highlightKeywords.js"],
            })
            .then(() => {
               // If you try and inject into an extensions page or the webstore/NTP you'll get an error
               if (chrome.runtime.lastError) {
                  console.log("Chrome runtime error", chrome.runtime.lastError);
                  alert(
                     "There was an error injecting script : \n" +
                        chrome.runtime.lastError.message
                  );
               } else {
                  chrome.tabs.query(
                     { active: true, currentWindow: true },
                     function (tabs) {
                        chrome.tabs.sendMessage(
                           tabs[0].id,
                           {
                              action: "keywords_to_highlight",
                              matches: matches,
                              unmatches: unmatches,
                              source: matches.concat(unmatches),
                              synonyms: synonyms,
                           },
                           function (response) {}
                        );
                     }
                  );
               }
            });
      });
}

function handleFeedbackBox() {
   for (var star of ["#5_star, #4_star"]) {
      $(star).click(function () {
         trackEvent("result_page_feedback_high_stars", "click");
         window.location.href = "/html/review_us.html";
      });
   }
   for (var star of ["#3_star, #2_star, #1_star"]) {
      $(star).click(function () {
         trackEvent("result_page_feedback_low_stars", "click");
         window.location.href = "/html/feedback_us.html";
      });
   }

   $("#not_now").click(function () {
      trackEvent("result_page_feedback_not_now", "click");

      handleNotNow(function () {
         $("#feedbackDiv").css("display", "none");
      });
   });
}

function activateFeedback() {
   $("#feedbackDiv").css("display", "block");
   trackEvent("result_page_feedback", "view");
}

function buildTrackableUrl(user_id, job_url) {
   var result = new URL("https://jobalytics.co/job-redirect");
   result.searchParams.set("job_url", job_url);
   result.searchParams.set("source", "chrome_extension");
   result.searchParams.set("user_id", user_id);
   return result.toString();
}

function maybeDisplayJobRec() {
   var now_time = Math.round(Date.now() / 1000);

   var data_to_load = [
      "job_rec__last_title",
      "job_rec__last_loc",
      "job_rec__num_recs_to_show",
      "job_rec__num_shown",
      "job_rec__num_of_times_last_one_was_shown",
      "job_rec__recs",
      "job_rec__prev_employers",
      "job_rec__last_query_success",
      "uuid",
   ];
   chrome.storage.local.get(data_to_load, function (result) {
      var last_title = default_to(result["job_rec__last_title"], "");
      var last_loc = default_to(result["job_rec__last_loc"], "");
      var num_recs_to_show = default_to(result["job_rec__num_recs_to_show"], 0);
      var num_shown = default_to(result["job_rec__num_shown"], 0);
      var num_of_times_last_one_was_shown = default_to(
         result["job_rec__num_of_times_last_one_was_shown"],
         0
      );
      var recs = default_to(result["job_rec__recs"], []);
      var employer_to_time = default_to(result["job_rec__prev_employers"], {
         nobody: now_time,
      });
      var last_success = default_to(result["job_rec__last_query_success"], 0);
      var uuid = default_to(result["uuid"], "");
      var now_time = Math.round(Date.now() / 1000);

      // if there's no uuid, it wasn't initialized by some error. Try to initialize it now.
      if (!Boolean(uuid)) {
         with_uuid(function () {});
      }

      console.log(
         "we've recommended " + num_shown + "/" + num_recs_to_show + " jobs"
      );

      // we have more recs to show, and they were fetched less than 24 hours ago
      if (
         num_shown < num_recs_to_show &&
         now_time - last_success < 60 * 60 * 24
      ) {
         var rec = recs[num_shown];

         var user_id = uuid + "___" + last_title + "___" + last_loc;
         var trackable_url = buildTrackableUrl(user_id, rec["url"]);

         document
            .getElementById("job_rec_link")
            .addEventListener("click", function () {
               trackEvent("job_recommendation", "click");

               try {
                  var transaction_id =
                     uuid + "__" + new Date().getTime().toString();
                  var transaction = {
                     id: transaction_id,
                     revenue: rec["bid"],
                  };
                  ga("ecommerce:addTransaction", transaction);
                  ga("ecommerce:send");
                  console.log("job rec click value sent to ga: ");
                  console.log(transaction);
               } catch (e) {}

               chrome.storage.local.set({
                  job_rec__num_of_times_last_one_was_shown: 2,
               });

               chrome.tabs.create({ active: true, url: trackable_url });
            });
         document.getElementById("job_rec_link").innerHTML = rec["title"];
         document.getElementById("job_rec_company").innerHTML = rec["employer"];
         document.getElementById("job_rec_loc").innerHTML = rec["location"];
         document.getElementById("job_rec_score").innerHTML = Math.round(
            rec["match_score"] * 100
         ).toString();

         $("#job_rec_box").css("display", "block");

         employer_to_time[rec["employer"].toLowerCase()] = now_time;

         if (num_of_times_last_one_was_shown == 2) {
            // really each rec is shown 3 times (0, 1, 2)
            num_of_times_last_one_was_shown = 0;
            num_shown += 1;
         } else {
            num_of_times_last_one_was_shown += 1;
         }

         chrome.storage.local.set({
            job_rec__num_shown: num_shown,
            job_rec__num_of_times_last_one_was_shown:
               num_of_times_last_one_was_shown,
            job_rec__prev_employers: employer_to_time,
         });

         trackEvent("job_recommendation", "display");
      }

      function copyToShare() {
         const copyIcon = document.querySelector("#copyIcon");
         const tooltipText = document.querySelector("#tooltipText");

         function copyURLToClipboard() {
            const extensionURL =
               "https://chrome.google.com/webstore/detail/jobalytics-resume-keyword/fkiljfkkceaopbpfgfmjdnkiejaifkgd?utm_medium=extension&utm_source=copyIcon";
            navigator.clipboard
               .writeText(extensionURL)
               .then(() => {
                  tooltipText.style.visibility = "visible";
               })
               .then(() => {
                  setTimeout(() => {
                     tooltipText.style.visibility = "hidden";
                  }, 1000);
               })
               .catch((error) => {
                  console.log(`Copy failed! ${error}`);
               });
         }
         copyIcon.addEventListener("click", copyURLToClipboard);
      }
      console.log("fucntion ran till end");

      copyToShare();
   });
}
