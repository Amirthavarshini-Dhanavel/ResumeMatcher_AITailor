var char_threshold = 400;

var min_char_threshold = 75;
console.log("Crawler ran");

var debug = false;
function debug_log(msg) {
   if (debug) {
      // console.log("[JOBALYTICS] " + msg)
   }
}
function get_supported_page() {
   var url = new URL(window.location.href);

   if (url.hostname == "www.indeed.com" && url.pathname == "/jobs") {
      return "indeed_job_search";
   } else if (url.hostname == "www.indeed.com" && url.pathname == "/viewjob") {
      return "indeed_job_view";
   } else if (url.hostname == "www.indeed.com" && url.pathname == "/viewjob") {
      return "indeed_job_view";
   } else if (
      url.hostname == "www.linkedin.com" &&
      url.toString().indexOf("/jobs/view/") > -1
   ) {
      return "linkedin_job_view";
   } else if (
      url.hostname == "www.linkedin.com" &&
      url.toString().indexOf("/jobs/collections/") > -1
   ) {
      return "linkedin_job_collection";
   } else if (
      url.hostname == "www.linkedin.com" &&
      url.pathname.startsWith("/jobs/search")
   ) {
      return "linkedin_job_search";
   } else if (
      url.hostname.endsWith("myworkdayjobs.com") &&
      url.toString().indexOf("/job") > -1
   ) {
      return "myworkday_job_view";
   } else if (
      url.hostname == "www.glassdoor.com" &&
      url.pathname.startsWith("/Job")
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

function get_job_descr_elm() {
   var page = get_supported_page();

   if (page == "indeed_job_search") {
      var iframe = document.getElementById("vjs-container-iframe");
      var maybeDiv = iframe?.contentWindow?.document?.getElementsByClassName(
         "jobsearch-JobComponent-embeddedBody"
      )[0];
      if (maybeDiv != null) {
         return maybeDiv;
      } else {
         return document.getElementById("jobDescriptionText");
      }
   } else if (page == "indeed_job_view") {
      return document.getElementById("jobDescriptionText");
   } else if (
      page == "linkedin_job_view" ||
      page === "linkedin_job_collection"
   ) {
      return document.getElementById("job-details");
   } else if (page == "glassdoor_job_search") {
      return document.querySelector(
         'div[class*="JobDetails_jobDescriptionWrapper"]'
      );
   } else if (page == "linkedin_job_search") {
      var loggedin_details = document.getElementById("job-details");
      if (loggedin_details != null) {
         return loggedin_details;
      }

      try {
         var details = document.getElementsByClassName(
            "details-pane__content"
         )[0];
         return details.getElementsByClassName("description")[0];
      } catch (err) {
         return null;
      }
   } else if (page == "myworkday_job_view") {
      return document.querySelector(
         "*[data-automation-id='jobPostingDescription']"
      );

      // return document.getElementById(
      //    "richTextArea.jobPosting.jobDescription-input"
      // );
   } else if (page == "handshake_job_view" || page == "handshake_job_search") {
      return document.getElementsByClassName("style__container___3At56")[0];
   } else {
      // console.log("not a supported page");
      return null;
   }
}

function crawl_elm(elm) {
   var target_elm = get_job_descr_elm();
   if (target_elm != null) {
      return crawl_elm_blind(target_elm);
   }

   // unknown page
   else {
      return crawl_elm_smart(elm);
   }
}
window.crawl_elm = crawl_elm;

function excluded(elm) {
   return ["STYLE", "SCRIPT", "NOSCRIPT", "IFRAME", "OBJECT"].includes(
      elm.tagName
   );
}

function is_text_node(elm) {
   return elm.nodeType == Node.TEXT_NODE || elm.tagName == "BR";
}

function crawl_elm_smart(elm) {
   if (is_text_node(elm)) {
      return crawl_text(elm);
   }
   var result = empty_result();

   // leaf with no text. That's problematic.
   if (elm.childNodes.length == 0 || excluded(elm)) {
      result["has_non_text"] = true;
      return result;
   }

   for (const child of elm.childNodes) {
      var child_result = crawl_elm_smart(child);
      accumulate(result, child_result);
   }

   // still all text
   if (!result["has_non_text"]) {
      return result;
   }

   // has non text, time to save what's saveable
   return filter_result(result);
}

function crawl_text(textNode) {
   var parent = textNode.parentElement;
   var parentHeight = parent.offsetHeight;

   var text = textNode.nodeValue;
   if (textNode.tagName == "BR") {
      text = "\n";
   }
   if (text == null) {
      // console.log("undefined text node found: ")
      // console.log(textNode);
   }

   var result = empty_result();
   if (parentHeight == 0 || parentHeight == null) {
      result["invisible"] = [text];
      result["invis_elms"] = [parent];
   } else {
      result["visible"] = [text];
      result["vis_elms"] = [parent];
   }
   return result;
}

function empty_result() {
   return {
      visible: [],
      invisible: [],
      saved: [],
      has_non_text: false,
      vis_elms: [],
      invis_elms: [],
      saved_elms: [],
   };
}

function filter_result(result) {
   debug_log("filtering results on...");
   debug_log("visible: " + result["visible"]);
   debug_log("invisible: " + result["invisible"]);

   var min_visible_length = 0;
   var visible_chars = 0;
   for (const text of result["visible"]) {
      visible_chars += text.length;
      min_visible_length = Math.max(min_visible_length, text.length);
   }
   var invisible_chars = 0;
   for (const text of result["invisible"]) {
      invisible_chars += text.length;
   }
   result["has_non_text"] = true;

   if (visible_chars > char_threshold) {
      // rescue everything
      if (min_visible_length > min_char_threshold) {
         // rescue invisible characters as well
         result["saved"].push(...result["visible"]);
         result["saved"].push(...result["invisible"]);
         result["saved_elms"].push(...result["vis_elms"]);
         result["saved_elms"].push(...result["invis_elms"]);
      }
   }

   result["visible"] = [];
   result["invisible"] = [];

   return result;
}

function accumulate(accumulator, result2) {
   accumulator["visible"].push(...result2["visible"]);
   accumulator["invisible"].push(...result2["invisible"]);
   accumulator["saved"].push(...result2["saved"]);
   accumulator["has_non_text"] =
      accumulator["has_non_text"] || result2["has_non_text"];
   accumulator["vis_elms"].push(...result2["vis_elms"]);
   accumulator["invis_elms"].push(...result2["invis_elms"]);
   accumulator["saved_elms"].push(...result2["saved_elms"]);

   return accumulator;
}

function highlight_crawl_result(crawl_result) {
   var saved_backgrounds = [];
   for (var elm of new Set(crawl_result["saved_elms"])) {
      saved_backgrounds.push([elm, elm.style.backgroundColor]);
      elm.style.backgroundColor = "yellow";
   }
   return saved_backgrounds;
}

// ----------------- HARDCODED CRAWLERS THAT CRAWL EVERYTHING IN AN ELM ------------------

function crawl_elm_blind(elm, depth = 0) {
   var to_return = {
      saved: [],
      saved_elms: [],
   };

   // dont crawl persistent score div
   if (
      elm.classList != undefined &&
      elm.classList.contains("persistent-image")
   ) {
      return to_return;
   }

   if (is_text_node(elm)) {
      var text = elm.nodeValue;
      if (text == null) {
         text = "";
      }

      to_return["saved"].push(text);
      return to_return;
   }

   var is_text_parent = false;

   for (var child of elm.childNodes) {
      if (is_text_node(child)) {
         is_text_parent = true;
      }
      var result = crawl_elm_blind(child, (depth = depth + 1));
      to_return["saved"].push(...result["saved"]);
      to_return["saved_elms"].push(...result["saved_elms"]);
   }

   if (is_text_parent) {
      to_return["saved_elms"].push(elm);
   }

   return to_return;
}

// export { crawl_elm };
