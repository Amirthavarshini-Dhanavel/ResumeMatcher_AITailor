import { general_keywords } from "/keywords/general_keywords.js";
import { synonyms } from "/keywords/synonyms_list.js";
import { pm_keywords } from "/keywords/pm.js";
import { swe_essentials } from "/keywords/swe_essentials.js";
import { swe_nice_to_haves } from "/keywords/swe_nice_to_haves.js";
import { pm_marketing_keywords } from "/keywords/pm_marketing.js";
import { marketing_keywords } from "/keywords/marketing.js";

const sleep = (milliseconds) => {
   return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

var hasData = false;
var resumeData = "";
function awaitResumeData() {
   return new Promise((resolve) => {
      chrome.storage.local.get(["resume"], function (result) {
         if (result["resume"] !== undefined) {
            hasData = true;
            resumeData = result["resume"];
         }
         resolve();
      });
   });
}
chrome.storage.local.get(["resume"], function (result) {
   if (result["resume"] !== undefined) {
      hasData = true;
      resumeData = result["resume"];
   }
   // resolve();
});
// awaitResumeData();
var debug_printer = new DebugPrinter();

function canonicalKeywords() {
   return general_keywords;
}

function getResumeString() {
   if (hasUploadedResume()) {
      return resumeData;
   } else {
      return "";
   }
}

function hasUploadedResume() {
   return hasData;
}

async function getActiveTab() {
   const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
   return tabs[0];
}
function runGetPageSource() {
   sleep(10).then(async () => {
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
                  files: ["/js/getPagesSource.js"],
               })
               .then(() => {
                  if (chrome.runtime.lastError) {
                     chrome.tabs.query(
                        { active: true, currentWindow: true },
                        function (tabs) {
                           var url = tabs[0].url;
                           trackEvent(
                              "scan_job_desc",
                              "errorGetPageSource",
                              url
                           );
                           window.location.href = "/html/job-not-found.html";
                        }
                     );
                  }
               });
         });
   });
}

// input: url of the job we're trying to find the domain for
// in some cases a 'search_title' string could be passed in instead of a url here
function fetchDomain(url) {
   const swe_regex = new RegExp(
      "engineer(ing)?|developer|programmer|coder|solutions architect|machine learning|ai|tech( analyst)?",
      "gi"
   );
   const marketing_pm_regex = new RegExp(
      "product|marketing|marketer|advertising|advertiser|copywriting|copywriter|social media|brand|ambassador|cmo",
      "gi"
   );

   var job_title_parsing = "";
   if (
      url.hostname &&
      url.hostname == "www.linkedin.com" &&
      url.pathname &&
      url.pathname.startsWith("/jobs/search")
   ) {
      job_title_parsing = default_to(
         url.searchParams.get("keywords"),
         ""
      ).toLowerCase();
   } else if (
      url.hostname &&
      url.hostname == "www.indeed.com" &&
      url.pathname &&
      url.pathname == "/jobs"
   ) {
      job_title_parsing = default_to(
         url.searchParams.get("q"),
         ""
      ).toLowerCase();
   } else {
      job_title_parsing = url;
   }

   if (swe_regex.test(job_title_parsing)) {
      return "swe";
   } else if (marketing_pm_regex.test(job_title_parsing)) {
      return "pm_marketing";
   } else {
      return "general";
   }
}

function waitForPageSourceThenScan() {
   var num_frames = 0;
   chrome.runtime.onMessage.addListener(function (request, sender) {
      if (request.action == "countFrames") {
         num_frames += 1;
         // debug_printer.log("frames is " + num_frames)
      }
   });

   var source_html = "";
   var frames_seen = 0;
   chrome.runtime.onMessage.addListener(function (request, sender) {
      if (request.action == "getSource") {
         source_html += "\n" + request.source.replace(/\bgo\b/g, "");
         // debug_printer.log("GOT GETSOURCE RESULT:")
         // debug_printer.log(request.source)
         frames_seen += 1;
         if (frames_seen == num_frames) {
            chrome.tabs.query(
               { active: true, currentWindow: true },
               function (tabs) {
                  const activeTab = tabs[0]; // Get the active tab
                  // Get the current URL and redirect
                  compareAndRedirect(source_html, activeTab.url);
               }
            );
            // chrome.tabs.getSelected(null, function (tab) {
            //    // get the current url and redirect
            //    compareAndRedirect(source_html, tab.url);
            // });
         }
      }
   });
   chrome.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
      const tabId = tabs[0].id;
      console.log("Count frames called");
      chrome.scripting.executeScript({
         target: { tabId, allFrames: true },
         files: ["/js/count_frames.js"],
      });
   });
}

function get_supported_page(url = "") {
   var url = url || new URL(window.location.href);

   if (url.hostname == "www.indeed.com" && url.pathname == "/jobs") {
      return "indeed_job_search";
   } else if (url.hostname == "www.indeed.com" && url.pathname == "/viewjob") {
      return "indeed_job_view";
   } else if (
      url.hostname == "www.linkedin.com" &&
      url.toString().indexOf("/jobs/view/") > -1
   ) {
      return "linkedin_job_view";
   } else if (
      url.hostname == "www.linkedin.com" &&
      url.pathname.startsWith("/jobs/search")
   ) {
      return "linkedin_job_search";
   } else if (
      url.hostname.endsWith("myworkdayjobs.com") &&
      (url.toString().indexOf("/job") > -1 ||
         url.toString().indexOf("/details") > -1)
   ) {
      return "myworkday_job_view";
   } else if (
      url.hostname == "www.glassdoor.com" &&
      (url.pathname.startsWith("/Job") ||
         url.pathname.startsWith("/job-listing"))
   ) {
      return "glassdoor_job_search";
   } else if (
      url.hostname.endsWith("joinhandshake.com") &&
      url.pathname.startsWith("/jobs")
   ) {
      return "handshake_job_view";
   } else if (
      url.hostname.endsWith("joinhandshake.com") &&
      url.pathname.startsWith("/postings")
   ) {
      return "handshake_job_search";
   } else {
      // console.log("not a supported page");
      return null;
   }
}

async function compareAndRedirect(job_text, url) {
   /*
    1) scan both resume and job descriptions
    2) run keyword matcher
    3) construct redirect string
    */
   await awaitResumeData();
   // get the resume text
   var resume_text = getResumeString();
   // find the match result
   var match_result = get_match_result(url, resume_text, job_text);
   console.log("Match result", match_result, resume_text);

   var redirectParameters = match_result["redirect_param"];
   if (!debug_printer.on()) {
      window.location.href = "/html/result.html" + redirectParameters;
   }
   var matchScore = match_result["score"];
   if (isNaN(matchScore)) {
      // trackEvent("scan_job_desc", "errorNaNMatchScore", url);
      window.location.href = "/html/job-not-found.html";
      // in case sending GA event fails, we still redirect
      sleep(100).then(() => {
         window.location.href = "/html/job-not-found.html";
      });
   }
}

function getKeywordsFromTextWithSuffixes(text, domain) {
   var suffixes = ["ing", "d", "ed", "s"];
   var words = domain.sort((a, b) => b.length - a.length);
   var keywords = getKeywordsFromText(text, words);
   debug_printer.log("vanilla keywords " + JSON.stringify(keywords));

   var all_keywords = [].concat(keywords);
   for (var suffix of suffixes) {
      var suffix_keywords = getKeywordsFromText(
         text,
         words.map((word) => word + suffix)
      );
      debug_printer.log(
         suffix + " keywords " + JSON.stringify(suffix_keywords)
      );
      suffix_keywords = suffix_keywords.map((w) =>
         w.substring(0, w.length - suffix.length)
      );
      all_keywords = all_keywords.concat(suffix_keywords);
   }
   return [...new Set(all_keywords)];
}

function getKeywordsFromText(text, words) {
   function removeDups(list_keywords) {
      let unique = {};
      list_keywords.forEach(function (i) {
         if (!unique[i]) {
            unique[i] = true;
         }
      });
      return Object.keys(unique);
   }

   // Created regexp to distinguish between word characters and non-word characters.
   let regexForSpecialWords = new RegExp(/\b[a-z]\W+\B/, "i");

   // Filter word characters and putting them in normal words.
   let normalWords = words.filter((w) => !regexForSpecialWords.test(w));

   // Filter non-word characters and putting them in special words.
   let specialWords = words.filter((w) => regexForSpecialWords.test(w));

   /* Creating a vriable containing regexp metacharacters and then using it to replace those
    metacharacters inside normalWords and specialwords with \\$& */
   var regexMetachars = /[(){[*+?.\\^$|]/g;
   normalWords = normalWords.map((w) => w.replace(regexMetachars, "\\$&"));
   specialWords = specialWords.map((sl) => sl.replace(regexMetachars, "\\$&"));

   /* Creating a regexp for match the word characters and non-word characters with the job description
    text string. And then matching the job description text with regexp and captureing it by variable */
   var regex = new RegExp(
      "\\b(?:" +
         specialWords.join("|") +
         ")\\B|\\b(?:" +
         normalWords.join("|") +
         ")\\b",
      "gi"
   );

   var keywords = removeDups(text.match(regex) || []);

   // turn dashes into spaces
   for (var i = 0; i < keywords.length; i++) {
      keywords[i] = keywords[i].split("-").join(" ");
   }

   return keywords;
}

// function loadAnalytics() {
//       .then(() => {
//          window.dataLayer = window.dataLayer || [];
//          function gtag() {
//             dataLayer.push(arguments);
//          }
//          gtag("js", new Date());

//          // Initialize GA4 tracker
//          gtag("config", "G-NB84M0TM7E");
//       })
//       .catch((error) =>
//          console.error("Error loading Google Analytics:", error)
//       );
// }
// function trackEvent(eventCategory, eventAction, eventURL) {
//    gtag("event", eventAction, {
//       event_category: eventCategory,
//       url: eventURL,
//    });
// }
function get_match_result(url, resume_text, job_text) {
   // find the domain of the job
   var domain = fetchDomain(url);
   console.dir(resume_text, { maxStringLength: Infinity });
   console.log("my domain", domain);
   // for swe we're using a weighted algorithm to get the match score
   if (domain == "swe") {
      var resume_essentials = getKeywordsFromTextWithSuffixes(
         resume_text,
         swe_essentials
      );
      var resume_nice_to_haves = getKeywordsFromTextWithSuffixes(
         resume_text,
         swe_nice_to_haves
      );

      var job_essentials = getKeywordsFromTextWithSuffixes(
         job_text,
         swe_essentials
      );
      var job_nice_to_haves = getKeywordsFromTextWithSuffixes(
         job_text,
         swe_nice_to_haves
      );

      return match_result_via_weighted_algorithm(
         resume_essentials,
         resume_nice_to_haves,
         job_essentials,
         job_nice_to_haves
      );
   }
   // for pm_marketing and general, we're using a basic non-weighted algorithm
   else {
      if (domain == "pm_marketing") {
         var domain_keywords = pm_marketing_keywords;
      } else {
         var domain_keywords = general_keywords;
      }

      var resumeKeywords = getKeywordsFromTextWithSuffixes(
         resume_text,
         domain_keywords
      );
      var jobKeywords = getKeywordsFromTextWithSuffixes(
         job_text,
         domain_keywords
      );
      const result = match_result_via_basic_algorithm(
         resumeKeywords,
         jobKeywords
      );
      console.log("Keywords", jobKeywords, resumeKeywords, result, job_text);
      return result;
   }
}

// KEYWORD MATCHER FUNCTIONS
function match_result_via_weighted_algorithm(
   resume_essentials,
   resume_nice_to_haves,
   job_essentials,
   job_nice_to_haves
) {
   // lowercase all keywords in all array and remove duplicates
   resume_essentials = correct_for_prefixes(
      correct_for_synonyms([
         ...new Set(resume_essentials.map((keyword) => keyword.toLowerCase())),
      ])
   );
   resume_nice_to_haves = correct_for_prefixes(
      correct_for_synonyms([
         ...new Set(
            resume_nice_to_haves.map((keyword) => keyword.toLowerCase())
         ),
      ])
   );
   job_essentials = correct_for_prefixes(
      correct_for_synonyms([
         ...new Set(job_essentials.map((keyword) => keyword.toLowerCase())),
      ])
   );
   job_nice_to_haves = correct_for_prefixes(
      correct_for_synonyms([
         ...new Set(job_nice_to_haves.map((keyword) => keyword.toLowerCase())),
      ])
   );

   // console.log("----match_result_via_weighted_algorithm-----")
   // console.log("resume essentials");
   // console.log(resume_essentials);
   // console.log("resume nice to haves");
   // console.log(resume_nice_to_haves);
   // console.log("job_essentials");
   // console.log(job_essentials);
   // console.log("job_nice_to_haves");
   // console.log(job_nice_to_haves);

   var essentials_matches = job_essentials.filter((x) =>
      resume_essentials.includes(x)
   );
   var essentials_missing = job_essentials.filter(
      (x) => !resume_essentials.includes(x)
   );

   var nice_to_haves_matches = job_nice_to_haves.filter((x) =>
      resume_nice_to_haves.includes(x)
   );
   var nice_to_haves_missing = job_nice_to_haves.filter(
      (x) => !resume_nice_to_haves.includes(x)
   );

   // console.log("essentials_matches");
   // console.log(essentials_matches);
   // console.log("essentials_missing");
   // console.log(essentials_missing);
   // console.log("nice_to_haves_matches");
   // console.log(nice_to_haves_matches);
   // console.log("nice_to_haves_missing");
   // console.log(nice_to_haves_missing);

   if (
      essentials_matches.length == 0 &&
      essentials_missing.length == 0 &&
      nice_to_haves_matches.length == 0 &&
      nice_to_haves_missing.length == 0
   ) {
      var score = 0;
   } else {
      var score =
         (essentials_matches.length * 5 + nice_to_haves_matches.length) /
         ((essentials_matches.length + essentials_missing.length) * 5 +
            nice_to_haves_matches.length +
            nice_to_haves_missing.length);
   }

   // console.log("score");
   // console.log(score);

   var matches_str = encodeURIComponent(
      JSON.stringify(essentials_matches.concat(nice_to_haves_matches))
   );
   var missing_str = encodeURIComponent(
      JSON.stringify(essentials_missing.concat(nice_to_haves_missing))
   );

   var result_dict = {};
   result_dict["redirect_param"] =
      "?matches=" +
      matches_str +
      "&unmatches=" +
      missing_str +
      "&score=" +
      score;
   result_dict["score"] = score;

   return result_dict;
}

function match_result_via_basic_algorithm(arr1, arr2) {
   var dict = {};

   var i;

   for (i = 0; i < arr1.length; i++) {
      arr1[i] = arr1[i].toLowerCase();
   }

   for (i = 0; i < arr2.length; i++) {
      arr2[i] = arr2[i].toLowerCase();
   }

   arr1 = correct_for_prefixes(correct_for_synonyms(arr1));
   arr2 = correct_for_prefixes(correct_for_synonyms(arr2));

   var intersection_all = arr1.filter((x) => arr2.includes(x));
   var intersection = Array.from(new Set(intersection_all));
   var difference_all = arr2.filter((x) => !arr1.includes(x));
   var difference = Array.from(new Set(difference_all));

   debug_printer.log("matches: " + JSON.stringify(intersection));
   debug_printer.log("unmatches: " + JSON.stringify(difference));

   var score = arr2.length > 0 ? intersection.length / arr2.length : 0;

   dict["matches"] = intersection;
   dict["unmatches"] = difference;
   dict["score"] = score;

   debug_printer.log("matches: " + JSON.stringify(intersection));
   debug_printer.log("unmatches: " + JSON.stringify(difference));
   debug_printer.log("score: " + score);

   var matches_str = encodeURIComponent(JSON.stringify(intersection));
   var unmatches_str = encodeURIComponent(JSON.stringify(difference));

   var result_dict = {};
   result_dict["redirect_param"] =
      "?matches=" +
      matches_str +
      "&unmatches=" +
      unmatches_str +
      "&score=" +
      score;
   result_dict["score"] = score;

   return result_dict;
}

var word_prefixes = [
   "communicat",
   "strateg",
   "project manage",
   "product manage",
   "engineer",
   "collaborat",
   "machine learning",
];

function correct_for_prefixes(input_arr) {
   var prefix_to_kw = {};
   var kw_to_prefix = {};
   for (const prefix of word_prefixes) {
      for (const kw of input_arr) {
         if (prefix == kw.substring(0, prefix.length)) {
            kw_to_prefix[kw] = prefix;
            if (!Object.keys(prefix_to_kw).includes(prefix)) {
               prefix_to_kw[prefix] = kw;
            }
         }
      }
   }

   var results = [
      ...new Set(
         input_arr.map((kw) => {
            if (!Object.keys(kw_to_prefix).includes(kw)) {
               return kw;
            } else {
               return prefix_to_kw[kw_to_prefix[kw]];
            }
         })
      ),
   ];

   return results;
}

// removes all duplicate synonyms from the kw list (so frontend and front-end aren't included for example)
function correct_for_synonyms(input_arr) {
   var idx_to_kw = {};
   var kw_to_idx = {};
   for (const kw of input_arr) {
      for (var i = 0; i < synonyms.length; i++) {
         var synonym = synonyms[i];
         if (synonym.includes(kw)) {
            kw_to_idx[kw] = i;
            if (!Object.keys(idx_to_kw).includes(String(i))) {
               idx_to_kw[i] = kw;
            }
         }
      }
   }

   var results = [
      ...new Set(
         input_arr.map((kw) => {
            if (!Object.keys(kw_to_idx).includes(kw)) {
               return kw;
            } else {
               return idx_to_kw[kw_to_idx[kw]];
            }
         })
      ),
   ];

   return results;
}

function DebugPrinter() {
   // console.log("Debug printer called");
   var debug_mode = false;

   // if (document.getElementById("debug") != null) {
   //    document
   //       .getElementById("debug")
   //       .addEventListener("change", function (result) {
   //          debug_mode = document.getElementById("debug").checked;
   //       });
   // }

   this.log = function (to_print) {
      if (debug_mode) {
         console.log("[JOBALYTICS DEBUG] " + to_print);
      }
   };

   this.on = function () {
      return debug_mode;
   };
}

function generate_uuid() {
   // from https://gist.github.com/jed/982883
   function b(a) {
      return a
         ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
         : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
   }
   return b("");
}

function with_uuid(cb) {
   chrome.storage.local.get(["uuid"], function (result) {
      var fetched_uuid = result["uuid"];
      if (fetched_uuid == undefined) {
         var uuid = generate_uuid();
         chrome.storage.local.set({ uuid: uuid }, function () {
            cb(uuid);
         });
      } else {
         cb(fetched_uuid);
      }
   });
}

function httpGetAsync(theUrl, callback) {
   var xmlHttp = new XMLHttpRequest();
   xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
         callback(xmlHttp.responseText);
   };
   xmlHttp.open("GET", theUrl, true); // true for asynchronous
   xmlHttp.send(null);
}

function default_to(in_val, default_val) {
   return Boolean(in_val) ? in_val : default_val;
}

function save_match_score_for_job_recs(score) {
   chrome.storage.local.get(["job_rec__prev_match_scores"], function (result) {
      var prev_scores = default_to(result["job_rec__prev_match_scores"], []);
      while (prev_scores.length > 60) {
         prev_scores.shift();
      }
      prev_scores.push(score);
      chrome.storage.local.set(
         {
            job_rec__prev_match_scores: prev_scores,
         },
         function () {}
      );
   });
}

// Reference: https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string
function extractHostname(url) {
   var hostname;
   //find & remove protocol (http, ftp, etc.) and get hostname

   if (url.indexOf("//") > -1) {
      hostname = url.split("/")[2];
   } else {
      hostname = url.split("/")[0];
   }

   //find & remove port number
   hostname = hostname.split(":")[0];
   //find & remove "?"
   hostname = hostname.split("?")[0];

   return hostname;
}

// Reference: https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string
function extractRootDomain(url) {
   var domain = extractHostname(url),
      splitArr = domain.split("."),
      arrLen = splitArr.length;

   //extracting the root domain here
   //if there is a subdomain
   if (arrLen > 2) {
      domain = splitArr[arrLen - 2] + "." + splitArr[arrLen - 1];
      //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
      if (
         splitArr[arrLen - 2].length == 2 &&
         splitArr[arrLen - 1].length == 2
      ) {
         //this is using a ccTLD
         domain = splitArr[arrLen - 3] + "." + domain;
      }
   }
   return domain;
}

export {
   default_to,
   save_match_score_for_job_recs,
   getResumeString,
   hasUploadedResume,
   waitForPageSourceThenScan,
   runGetPageSource,
   DebugPrinter,
   sleep,
   generate_uuid,
   canonicalKeywords,
   // exports used by createPersistentScore.js
   get_match_result,
   resumeData,
   hasData,
   synonyms,
   general_keywords,
   swe_essentials,
   swe_nice_to_haves,
   pm_keywords,
   marketing_keywords,
   pm_marketing_keywords,
   compareAndRedirect,
   getKeywordsFromTextWithSuffixes,
   httpGetAsync,
   with_uuid,
   extractRootDomain,
   getActiveTab,
   get_supported_page,
};
