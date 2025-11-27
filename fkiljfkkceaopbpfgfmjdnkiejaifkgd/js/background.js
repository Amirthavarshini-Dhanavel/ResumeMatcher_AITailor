import {
   getKeywordsFromTextWithSuffixes,
   default_to,
   with_uuid,
   swe_essentials,
   swe_nice_to_haves,
   pm_marketing_keywords,
   general_keywords,
   get_supported_page,
   get_match_result,
} from "/js/util.js";

import { app, db, collection, getDocs } from "../dist/firebase-bundle.js";

// import * as firestore from "firebase/firG-6Y1NG0PGLZestore";
// console.log("Firebaseapp", firestore);
//
// import * as firebaseApp from "firebase/app";
// console.log("Firebaseapp", firebaseApp);
// import * as $ from "/assets/vendor/jquery.min.js";

// const getFirestore = firestore.getFirestore;
// const collection = firestore.collection;
//
// const initializeApp = firebaseApp.initializeApp;
// let dataLayer = [];

chrome.runtime.onInstalled.addListener(() => {
   chrome.storage.local.get("ga_client_id", (data) => {
      const clientId =
         data.ga_client_id || `GA1.1.${crypto.randomUUID().replace(/-/g, "")}`;
      if (!data.ga_client_id) {
         chrome.storage.local.set({ ga_client_id: clientId });
      }

      // Call trackEvent with correct parameters
      // trackEvent("page_view", {}, clientId);
      trackEvent("resume_upload", { method: "button_click" }, clientId);
   });
});
function trackEvent(eventName, eventParams = {}, clientId) {
   console.log("Starting event tracking with:", {
      eventName,
      eventParams,
      clientId,
   });

   const gTag = "G-NB84M0TM7E";
   const API_KEY = "KmrEl-pjTI6qSfS-C08gYQ";

   // Get the actual client ID from storage if not provided
   fetch(
      `https://www.google-analytics.com/debug/mp/collect?measurement_id=${gTag}                                                                                 `,
      {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({
            client_id: clientId,
            events: [
               {
                  name: eventName,
                  params: {
                     ...eventParams,
                     debug_mode: true,
                     extension_event: true,
                     session_id: new Date().getTime(),
                     engagement_time_msec: 100,
                  },
               },
            ],
         }),
      }
   )
      .then((res) => res.json())
      .then(console.log)
      .catch(console.error);
}

// function trackEvent(event_name, event_params) {}
// function gtag() {
//    console.log("data layer before pushing args", dataLayer);
//    dataLayer.push(arguments);
// }

chrome.runtime.onInstalled.addListener(function (object) {
   if (object.reason === "install") {
      with_uuid(function (user_id) {
         var uninstall_url = new URL(
            "https://jobalytics.co/app-uninstall?utm_source=app&utm_medium=uninstall"
         );
         uninstall_url.searchParams.set("user_id", user_id);
         chrome.runtime.setUninstallURL(uninstall_url.toString());

         var get_started_url = new URL("https://www.jobalytics.co/get-started");
         get_started_url.searchParams.set("user_id", user_id);
         chrome.tabs.create(
            { url: get_started_url.toString() },
            function (tab) {}
         );
      });
   }
});

chrome.runtime.onUpdateAvailable.addListener(function (object) {
   // trackEvent("extension-auto-update");
   chrome.runtime.reload();
});

// ----------- PERSISTENT SCORE

function is_persistent_score_supported(url) {
   return (
      (url.hostname == "www.indeed.com" && url.pathname == "/jobs") ||
      (url.hostname == "www.indeed.com" && url.pathname == "/viewjob") ||
      (url.hostname == "www.linkedin.com" &&
         url.toString().indexOf("/jobs/view/") > -1) ||
      (url.hostname == "www.linkedin.com" &&
         url.pathname.startsWith("/jobs/search")) ||
      (url.hostname == "www.linkedin.com" &&
         url.pathname.startsWith("/jobs/collections")) ||
      (url.hostname.endsWith("myworkdayjobs.com") &&
         url.toString().indexOf("/job") > -1) ||
      (url.hostname.endsWith("myworkdayjobs.com") &&
         url.toString().indexOf("/details") > -1) ||
      (url.hostname == "www.glassdoor.com" &&
         url.pathname.startsWith("/Job")) ||
      (url.hostname == "www.glassdoor.com" &&
         url.pathname.startsWith("/job-listing")) ||
      url.hostname == "stags.bluekai.com" ||
      url.hostname.endsWith("joinhandshake.com")
   );
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
   if (changeInfo.status === "complete") {
      let new_url = new URL(tab.url);
      const page = get_supported_page(new_url);
      console.log("Tab update called");
      var support = is_persistent_score_supported(new_url);
      if (support) {
         if (
            new_url.hostname == "www.linkedin.com" ||
            new_url.pathname == "/viewjob" ||
            new_url.hostname.endsWith("myworkdayjobs.com") ||
            page === "indeed_job_search"
         ) {
            chrome.storage.local.get(
               ["persistent_score_on_key"],
               function (result) {
                  if (result["persistent_score_on_key"] != false) {
                     chrome.scripting.insertCSS({
                        target: { tabId: tabId },
                        files: ["/css/persistent_score.css"],
                     });
                     console.log("Creating score 1");
                     createPersistentScore(tabId, true);
                  } else {
                     console.log("Creating score 2");
                     if (
                        new_url.hostname == "www.linkedin.com" &&
                        new_url.pathname.startsWith("/jobs/search")
                     ) {
                        createPersistentScore(tabId, false);
                     }
                  }
               }
            );
         }
      }
   }
});

// This listener is specifically for scanning Indeed side-panel jobs, since they use iframes for their job descriptions
chrome.webNavigation.onCompleted.addListener(function (tab) {
   let new_url = new URL(tab.url);
   var support = is_persistent_score_supported(new_url);
   console.log("Support for score", support, new_url, tab);

   if (support && tab.tabId) {
      console.log("Inside first if");
      chrome.storage.local.get(["persistent_score_on_key"], function (result) {
         console.log("Inside function", result);
         if (result["persistent_score_on_key"] != false) {
            chrome.scripting.insertCSS({
               target: { tabId: tab.tabId },
               files: ["/css/persistent_score.css"],
            });
            createPersistentScore(tab.tabId, true);

            //Send message to content script
            if (
               (new_url.hostname == "www.glassdoor.com" &&
                  new_url.pathname.startsWith("/Job")) ||
               new_url.hostname == "stags.bluekai.com"
            ) {
               chrome.tabs.sendMessage(
                  tab.tabId,
                  { text: "report_back" },
                  GetTitleLocationWithDOM
               );
            }
         } else {
            if (
               new_url.hostname == "www.indeed.com" &&
               new_url.pathname.startsWith("/jobs")
            ) {
               createPersistentScore(tab.tabId, false);
            }
         }
      });
   }
});

chrome.webRequest.onCompleted.addListener(
   function (details) {
      if (extractRootDomain(details.initiator) === "joinhandshake.com") {
         chrome.storage.local.get(
            ["persistent_score_on_key"],
            function (result) {
               if (result["persistent_score_on_key"] != false) {
                  chrome.scripting.insertCSS({
                     target: { tabId: tabId },
                     files: ["/css/persistent_score.css"],
                  });
                  createPersistentScore(details.tabId, true);
               } else {
                  createPersistentScore(tab.tabId, false);
               }
            }
         );
      }
   },
   {
      urls: [
         "https://*.joinhandshake.com/jobs/*/recommended_jobs?_=*",
         "http://*.joinhandshake.com/jobs/*/recommended_jobs?_=*",
      ],
   }
);

function createPersistentScore(tabId, settings) {
   console.log("Create persistent score called");
   /*
    Provide a tabId for the chrome browser tab that we should launch a ContentScript on, and
    this function will launch the content script createPersistentScore.js.

    Note: the functions in crawler.js will also be imported into createPersistentScore.js
    */
   if (settings) {
      executeScripts(tabId, ["/js/crawler.js", "/js/createPersistentScore.js"]);
   } else {
      // executeScripts(tabId, ["/js/removePersistentScore.js"]);
   }
}

function executeScripts(tabId, script_files, allFrames = false) {
   console.log("Crawler is executed on frotnend");
   chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: script_files,
   });
   // .then(() => {
   //    if (chrome.runtime.lastError) {
   //       // console.log("error executing script " + script_files[0]);
   //    } else if (script_files.length > 1) {
   //       executeScripts(
   //          tabId,
   //          script_files.slice(1),
   //          (allFrames = allFrames)
   //       );
   //    }
   // });
}

// ----------- SAVE JOB
// const app = initializeFireBase();
// const app = window.firebaseApp;

function initializeFireBase() {
   // Your web app's Firebase configuration
   var firebaseConfig = {
      apiKey: "AIzaSyAcAaHbimH9lfJ9nx3ma3OCEDKDI2URlIo",
      authDomain: "jobalytics.firebaseapp.com",
      databaseURL: "https://jobalytics.firebaseio.com",
      projectId: "jobalytics",
      storageBucket: "jobalytics.appspot.com",
      messagingSenderId: "351217594342",
      appId: "1:351217594342:web:3d299befebae6864f07027",
      measurementId: "G-N7E5N8SE44",
   };
   // Initialize Firebase]
   return initializeApp(firebaseConfig);
}
// const analytics = getAnalytics(app);
// const db = getFirestore(app);
// const db = window.firebaseDb;
self.myApp = app;
self.mydb = db;
// console.log("db", db);
var jobs_collection = collection(db, "jobs");
// console.log(jobs_collection, "jobs collection");

function storeJob(job_data) {
   var job = job_data.job;
   var url = job_data.url;

   if (job != "") {
      var title = job_data.job_title;
      var loc = job_data.job_loc;
      var employer = job_data.job_employer;
      var source = job_data.source;

      if (title == "" || loc == "" || employer == "" || url == "") {
         if (url.length > 490) {
            url = url.substring(0, 490) + "<CUTOFF>";
         }

         try {
            var url_obj = new URL(url);
            trackEvent("save_job_to_firebase_v1", "missing_info", url);
            // console.log("saving job: missing info with pathname")
         } catch (err) {
            trackEvent("save_job_to_firebase_v1", "missing_info", url);
            // console.log("saving job: missing info with no pathname")
         }

         trackEvent(
            "save_job_to_firebase_v1",
            "missing_info_specific_url",
            url
         );
         // console.log("saving job: missing info with raw url")
         return;
      }

      // meet constraints on document ids:
      // no slashes
      var doc_id = url.split("/").join("<FS>");
      // less than 1500 bytes. let's do 1450 to be safe.
      doc_id = doc_id.substring(0, 1450);

      // console.log("trying to save doc_id: ")
      // console.log(doc_id)

      jobs_collection
         .doc(doc_id)
         .set({
            version: 2,
            job: job,
            url: url,
            timestamp: new Date().getTime(),
            title: title,
            location: loc,
            employer: employer,
            source: source,
         })
         .then(function () {
            // console.log("job successfully saved!");
            trackEvent("save_job_to_firebase_v1", "success", source);
         })
         .catch(function (error) {
            console.error("Error saving job: ", error);
            trackEvent(
               "save_job_to_firebase_v1",
               "error",
               source + ": " + error.toString()
            );
         });
   }
}

var last_saved = "";
chrome.runtime.onMessage.addListener(function (request, sender) {
   if (request.action == "save_job") {
      if (last_saved != request.job) {
         last_saved = request.job;
         // console.log("--------saving job! here's the job");
         // console.log(request.job.substring(0, 100));
         storeJob(request);
      }
   }
});

// ----------- JOB RECOMMENDATIONS

function is_job_rec_supported(url) {
   return (
      (url.hostname == "www.indeed.com" && url.pathname == "/jobs") ||
      (url.hostname == "www.indeed.com" && url.pathname == "/viewjob") ||
      (url.hostname == "www.linkedin.com" &&
         url.toString().indexOf("/jobs/view/") > -1) ||
      (url.hostname == "www.linkedin.com" &&
         url.pathname.startsWith("/jobs/search")) ||
      (url.hostname == "www.glassdoor.com" &&
         url.pathname.startsWith("/Job")) ||
      url.hostname == "stags.bluekai.com"
   );
}

function get_job_title_and_location(url_obj) {
   var search_title = "";
   var loc = "";

   if (
      url_obj.hostname == "www.linkedin.com" &&
      url_obj.pathname.startsWith("/jobs/search")
   ) {
      search_title = default_to(
         url_obj.searchParams.get("keywords"),
         ""
      ).toLowerCase();
      // if Location is not set, use united states by default
      loc = default_to(url_obj.searchParams.get("location"), "").toLowerCase();
   } else if (
      url_obj.hostname == "www.indeed.com" &&
      url_obj.pathname == "/jobs"
   ) {
      search_title = default_to(
         url_obj.searchParams.get("q"),
         ""
      ).toLowerCase();
      loc = default_to(url_obj.searchParams.get("l"), "").toLowerCase();
   }

   if (!Boolean(search_title) || !Boolean(loc)) {
      trackEvent(
         "job_recommendation",
         "fail_parse_title_loc_url",
         url_obj.toString()
      );
   }
   return [search_title, loc];
}

function get_job_recs(
   search_title,
   loc,
   last_page_fetched,
   last_num_recs_fetched,
   cb
) {
   //    console.log("Hello From get_job_recs")
   if (loc == "united states") {
      loc = "anywhere";
   }

   var rec_url = new URL("https://neuvoo.com/services/api-new/search");
   rec_url.searchParams.append("publisher", "13761a14");
   rec_url.searchParams.append("chnl1", "chrome_extension");
   rec_url.searchParams.append("format", "json");
   rec_url.searchParams.append("k", search_title);
   rec_url.searchParams.append("l", loc);
   rec_url.searchParams.append("radius", 64);
   rec_url.searchParams.append("country", "us");
   rec_url.searchParams.append("jobdesc", 1);
   rec_url.searchParams.append("contenttype", "all");
   rec_url.searchParams.append("ip", "1.1.1.1");
   rec_url.searchParams.append("useragent", navigator.userAgent);
   rec_url.searchParams.append("limit", 25);

   var page_fetched = last_num_recs_fetched == 25 ? last_page_fetched + 1 : 0;
   rec_url.searchParams.append("start", page_fetched);
   // console.log("job rec: about to fetch page " + page_fetched)

   // console.log(rec_url.href)

   fetch(rec_url.href)
      .then((res) => res.json())
      .then((result) => {
         if ("results" in result) {
            // console.log("total job rec results: " + result['totalresults'])
            cb(default_to(result["results"], []), page_fetched);
         } else {
            // console.log("no job rec results. Instead, response is: ")
            // console.log(result)
            trackEvent(
               "job_recommendation",
               "fetch_fail",
               search_title + "___" + loc + "___" + result.toString()
            );
         }
      })
      .catch(() => {
         var now_time = Math.round(Date.now() / 1000);
         chrome.storage.local.set({ job_rec__last_query_attempt: now_time });
      });
}

function filter_format_jobs(
   jobs,
   search_title,
   blacklisted_employers,
   resume_text,
   score_thres
) {
   var filtered_jobs = [];
   for (var job of jobs) {
      var title = job["jobtitle"].toLowerCase();
      // console.log("title: ",title)
      // console.log("search_title: ",search_title)
      // filter out jobs with no title match
      // TODO: don't include stop words in title match
      var title_parts = title.split(" ");
      // console.log("title_parts: ",title_parts)
      // console.log(title_parts.some(function (part) {return search_title.includes(part)}))
      if (
         !title_parts.some(function (part) {
            return search_title.includes(part);
         })
      ) {
         // console.log("skipping job bc of title match")
         continue;
      }

      // filter out jobs with wrong seniority
      var seniority_word_groups = [
         ["director", "vice president", "vp"],
         ["intern"],
      ];
      for (var word_group of seniority_word_groups) {
         if (
            // search title does not contain the seniority word, but the job title does
            !word_group.some(function (word) {
               return search_title.includes(word);
            }) &&
            word_group.some(function (word) {
               return title.includes(word);
            })
         ) {
            // console.log("skipping (" + title + ") bc of seniority words")
            continue;
         }
      }

      // filter out jobs with too short/null description
      var descr = default_to(job["description"], "");
      if (descr.length < 1000) {
         // console.log("skipping job bc descr too short")
         continue;
      }

      // filter out jobs older than 21 days
      if ((new Date() - new Date(job["date"])) / (1000 * 60 * 60 * 24) > 21.0) {
         // console.log("skipping job bc too old")
         continue;
      }

      // filter out jobs from employers seen in last 24 hours
      if (blacklisted_employers.has(job["company"].toLowerCase())) {
         // console.log("skipping job bc has seen employer before")
         continue;
      }

      // get the job text
      var job_text = job["description"];
      // get the match score
      var match_score = util.get_match_result(
         search_title,
         resume_text,
         job_text
      )["score"];

      // filter out jobs which have too low match score
      if (match_score < score_thres) {
         // console.log("skipping job bc match score is too low")
         continue;
      }

      var filtered_job = {
         title: job["jobtitle"],
         employer: job["company"],
         location: job["formattedLocation"],
         url: job["url"],
         date: job["date"],
         match_score: match_score,
         bid: job["bid"],
      };

      filtered_jobs.push(filtered_job);
   }

   return filtered_jobs;
}

function maybe_fetch_and_save_job_recs(search_title, loc) {
   //    console.log("Hello From maybe_fetch_and_save_job_recs")
   var state_keys = [
      "resume",
      // last job title queried
      "job_rec__last_title",
      // last location queried
      "job_rec__last_loc",
      // when was the last time we successfully queried for new job recs?
      "job_rec__last_query_success",
      // how many jobs recs were fetched from provider?
      "job_rec__num_recs_fetched",
      // how many job recs currently saved?
      "job_rec__num_recs_to_show",
      // how many currently saved recs have been considered/shown?
      "job_rec__num_shown",
      // how many times has the latest job rec been shown?
      "job_rec__num_of_times_last_one_was_shown",
      // last 32 saved match scores
      "job_rec__prev_match_scores",
      // previous employers to query times
      "job_rec__prev_employers",
      // when was the last time we attempted to query for new job recs?
      "job_rec__last_query_attempt",
      // since job recs are fetched in pages, what was the last page we fetched?
      "job_rec__last_page_fetched",
   ];
   chrome.storage.local.get(state_keys, function (result) {
      var resume_text = default_to(result["resume"], "");
      // console.log("resume: " + resume_text.substring(0, 100));

      var last_title = default_to(result["job_rec__last_title"], "");
      var last_loc = default_to(result["job_rec__last_loc"], "");

      var now_time = Math.round(Date.now() / 1000);
      var last_success = default_to(result["job_rec__last_query_success"], 0);
      // console.log("last_success: " + (now_time - last_success) + " secs ago")

      var num_recs_fetched = default_to(result["job_rec__num_recs_fetched"], 0);
      // console.log("num_recs_fetched: " + num_recs_fetched.toString())

      var num_recs_to_show = default_to(result["job_rec__num_recs_to_show"], 0);
      // console.log("num_recs_to_show: " + num_recs_to_show.toString())

      var num_shown = default_to(result["job_rec__num_shown"], 0);
      // console.log("num_shown: " + num_shown.toString())

      var prev_match_scores = default_to(result["job_rec__prev_match_scores"], [
         0.0,
      ]);
      // console.log("num prev_match_scores: " + prev_match_scores.length)

      var employer_to_time = default_to(result["job_rec__prev_employers"], {
         nobody: now_time,
      });
      // console.log("prev_employers: ")
      // console.log(employer_to_time)

      var last_attempt = default_to(result["job_rec__last_query_attempt"], 0);
      // console.log("last attempt long enough: " + (now_time - last_attempt > 40))

      var last_page_fetched = result["job_rec__last_page_fetched"];
      last_page_fetched =
         last_page_fetched == undefined ? -1 : last_page_fetched;
      // console.log("last page fetched:" + last_page_fetched)
      if (now_time - last_success > 43200) {
         last_page_fetched = -1;
         // console.log("correcting last_page_fetched to -1 because it's been too long");
      }

      if (
         // it's been 15 seconds since we last made a request attempt
         now_time - last_attempt > 15 &&
         // we have a resume, and we have scanned a few jobs to get an average score
         Boolean(resume_text) &&
         prev_match_scores.length >= 5 &&
         // either it's been 12 hours since we fetched recs,
         (now_time - last_success > 43200 ||
            // or it's been 3 minutes but we've exhausted all our recs
            (now_time - last_success > 180 &&
               num_shown - num_recs_to_show == 0) ||
            // or it's been 15 seconds, we've exhausted all our recs, but there are more pages to go through
            (now_time - last_success > 15 &&
               num_shown - num_recs_to_show == 0 &&
               num_recs_fetched == 25) ||
            // or the job title and location the user is searching for has changed
            last_title != search_title ||
            last_loc != loc)
      ) {
         get_job_recs(
            search_title,
            loc,
            last_page_fetched,
            num_recs_fetched,
            function (fetched_jobs, page_fetched) {
               // we only want to try this query once in a while to prevent DDoSing our provider, so we'll
               // record the attempt here, regardless of whether the rest succeeds.
               chrome.storage.local.set({
                  job_rec__last_query_attempt: now_time,
               });

               trackEvent("job_recommendation", "fetch_success");

               var employer_to_time_updated = Object();
               for (var employer of Object.keys(employer_to_time)) {
                  var employer_time = employer_to_time[employer];
                  if (employer_time > now_time - 60 * 60 * 24) {
                     employer_to_time_updated[employer] = employer_time;
                  }
               }
               var seen_employers = new Set(
                  Object.keys(employer_to_time_updated)
               );
               var score_thres =
                  prev_match_scores.sort()[
                     Math.round(0.666 * prev_match_scores.length)
                  ];
               // console.log("score thres for job recs is " + score_thres)

               var filtered_jobs = filter_format_jobs(
                  fetched_jobs,
                  search_title,
                  seen_employers,
                  resume_text,
                  score_thres
               );

               // console.log("there are " + fetched_jobs.length + " jobs before filtering")
               // console.log("there are " + filtered_jobs.length + " jobs after filtering")

               var deduped_jobs = {};
               for (var job of filtered_jobs) {
                  var employer = job["employer"].toLowerCase();
                  var existing_job = default_to(deduped_jobs[employer], {
                     match_score: -9999,
                  });
                  if (existing_job["match_score"] < job["match_score"]) {
                     deduped_jobs[employer] = job;
                  }
               }

               deduped_jobs = Object.values(deduped_jobs);

               // console.log("about to save last_page_fetched as " + page_fetched)
               chrome.storage.local.set(
                  {
                     job_rec__last_title: search_title,
                     job_rec__last_loc: loc,
                     job_rec__last_query_success: now_time,
                     job_rec__num_recs_fetched: fetched_jobs.length,
                     job_rec__num_recs_to_show: deduped_jobs.length,
                     job_rec__num_shown: 0,
                     job_rec__num_of_times_last_one_was_shown: 0,
                     job_rec__recs: deduped_jobs,
                     job_rec__prev_employers: employer_to_time_updated,
                     job_rec__last_page_fetched: page_fetched,
                  },
                  function () {
                     // console.log('save job recs to storage success')
                  }
               );

               trackEvent("job_recommendation", "save_success");
            }
         );
      } else {
         // console.log('skipping getting job recs, conditions not met')
      }
   });
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
   var new_url = new URL(tab.url);
   var url_supported = is_job_rec_supported(new_url);

   if (changeInfo.status === "complete" && url_supported) {
      var [search_title, loc] = get_job_title_and_location(new_url);
      // console.log("job rec supported")
      if (Boolean(search_title) && Boolean(loc)) {
         // console.log("url search_title, location: " + search_title + ", " + loc)
         // job title and location exist in the url
         maybe_fetch_and_save_job_recs(search_title, loc);
      } else {
         // job title and location are defaulted and so not in the url. need to fetch it from the actual dom
         executeScripts(tabId, [
            "/js/crawler.js",
            "/js/get_job_rec_title_and_loc.js",
         ]);
      }
   }
});

chrome.runtime.onMessage.addListener(function (request, sender) {
   if (request.action == "job_rec_title_and_loc") {
      // console.log("got search_title, loc for job rec from content script: " + request.search_title + ", " + request.loc)
      maybe_fetch_and_save_job_recs(request.search_title, request.loc);
   }
});

function GetTitleLocationWithDOM(element) {
   //    console.log("Title: " + element[0]);
   //    console.log("Location: " + element[1]);
   let title = element[0].toLowerCase().split(" ");
   let loc = element[1].toLowerCase().split(" ");
   maybe_fetch_and_save_job_recs(title, loc);
}

function parseRedirectParams(redirectParam) {
   try {
      const clean = redirectParam.startsWith("?")
         ? redirectParam.substring(1)
         : redirectParam;
      const u = new URL("http://x/?" + clean);
      const m = u.searchParams.get("matches");
      const ustr = u.searchParams.get("unmatches");
      const s = u.searchParams.get("score");
      const matches = m ? JSON.parse(m) : [];
      const unmatches = ustr ? JSON.parse(ustr) : [];
      const score = Number(s || 0);
      return { matches, unmatches, score };
   } catch (e) {
      return { matches: [], unmatches: [], score: 0 };
   }
}

function computeKeywordsFromTab(tabId, cb) {
   chrome.storage.local.get(["resume"], (r) => {
      const resume = r?.resume || "";
      console.log("[Jobalytics] computeKeywordsFromTab resume length:", resume?.length || 0);
      if (!resume) {
         cb({ error: "no_resume_in_jobalytics" });
         return;
      }
      chrome.tabs.get(tabId, (tab) => {
         if (!tab || !tab.url) {
            cb({ error: "no_tab" });
            return;
         }
         console.log("[Jobalytics] computeKeywordsFromTab tab url:", tab.url);
         chrome.scripting.executeScript(
            {
               target: { tabId, allFrames: true },
               func: () => (document && document.body ? document.body.innerText : ""),
            },
            (results) => {
               const job_text = (results || [])
                  .map((x) => (x && typeof x.result === "string" ? x.result : ""))
                  .join("\n");
               console.log("[Jobalytics] computeKeywordsFromTab job_text length:", job_text?.length || 0);
               const computed = get_match_result(tab.url, resume, job_text);
               const parsed = parseRedirectParams(
                  (computed && computed.redirect_param) || ""
               );
               console.log("[Jobalytics] parsed keywords lengths:", {
                  matches: (parsed.matches || []).length,
                  unmatches: (parsed.unmatches || []).length,
                  score: parsed.score || 0
               });
               chrome.storage.local.set(
                  {
                     matches: parsed.matches,
                     unmatches: parsed.unmatches,
                     score: parsed.score,
                     last_url: tab.url,
                  },
                  () => {
                     console.log("[Jobalytics] storage updated for last_url:", tab.url);
                     cb({
                        matches: parsed.matches,
                        unmatches: parsed.unmatches,
                        score: parsed.score,
                        jobUrl: tab.url,
                     });
                  }
               );
            }
         );
      });
   });
}

// ----------- EXTERNAL MESSAGING (for Orchestrator)
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
   try {
      console.log("[Jobalytics] onMessageExternal type:", msg?.type, "from:", sender?.id);
      if (msg && msg.type === "jm_get_keywords") {
         chrome.storage.local.get(["matches", "unmatches", "score", "last_url"], (v) => {
            console.log("[Jobalytics] jm_get_keywords returning lengths:", {
               matches: (v.matches || []).length,
               unmatches: (v.unmatches || []).length,
               score: v.score || 0,
               last_url: v.last_url || ""
            });
            sendResponse({
               matches: v.matches || [],
               unmatches: v.unmatches || [],
               score: v.score || 0,
               jobUrl: v.last_url || ""
            });
         });
         return true;
      }
      if (msg && msg.type === "jm_scan_and_get_keywords") {
         const tabId = msg.tabId;
         console.log("[Jobalytics] jm_scan_and_get_keywords for tabId:", tabId);
         computeKeywordsFromTab(tabId, (resp) => {
            console.log("[Jobalytics] jm_scan_and_get_keywords resp:", {
               error: resp?.error,
               matches: Array.isArray(resp?.matches) ? resp.matches.length : 0,
               unmatches: Array.isArray(resp?.unmatches) ? resp.unmatches.length : 0,
               jobUrl: resp?.jobUrl || ""
            });
            sendResponse(resp);
         });
         return true;
      }
   } catch (e) {
      try { sendResponse({ error: "jm_external_error" }); } catch {}
   }
});
