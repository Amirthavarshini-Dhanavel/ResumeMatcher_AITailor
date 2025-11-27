var highlighted = false;
var match_color = "#7CFC00";
var unmatch_color = "red";

var debug = false;
function debug_log(msg) {
   if (debug) {
      console.log("[JOBALYTICS] " + msg);
   }
}

chrome.runtime.onMessage.addListener(function (request, sender) {
   debug_log("highlighted is " + highlighted);
   debug_log("url is " + window.location.href);
   if (request.action == "keywords_to_highlight" && !highlighted) {
      var matches = request.matches;
      debug_log("matches to highlight is " + String(matches));
      var unmatches = request.unmatches;
      debug_log("unmatches to highlight is " + String(unmatches));
      var synonyms = request.synonyms;
      matches = with_keyword_variations(matches, synonyms);
      unmatches = with_keyword_variations(unmatches, synonyms);
      var elms = crawl_elm(document)["saved_elms"];
      highlight_keywords(matches, elms, match_color);
      highlight_keywords(unmatches, elms, unmatch_color);
      highlighted = true;
   }
});

function highlight_keywords(keywords, elms, color) {
   // we sort keywords so that longer keywords are highlighted first.
   // for "data-driven" and "data", we want "data-driven" to be
   // highlighted.
   keywords = keywords.sort((a, b) => b.length - a.length);
   debug_log("crawl_result is: " + elms);
   for (var elm of new Set(elms)) {
      var done = false;
      while (!done) {
         debug_log("not done yet");
         done = highlight_single_elm(elm, keywords, color);
      }
   }
}

function with_keyword_variations(keywords, synonyms) {
   var kw_synonyms = find_synonyms(keywords, synonyms);
   keywords = keywords.concat(kw_synonyms);

   var dash_kws = keywords.map((w) => w.replace(" ", "-"));
   var space_kws = keywords.map((w) => w.replace("-", " "));
   var concat_kws = keywords.map((w) => w.replace(" ", ""));

   /* There was a space error in concat_kws2.
  So a new variable called concat_kws1 is created to replace the "-"
  and then in concat_kws2 the space is replaced. */
   var concat_kws1 = keywords.map((w) => w.replace("-", " "));
   var concat_kws2 = concat_kws1.map((w) => w.replace(" ", ""));

   keywords = keywords.concat(dash_kws, space_kws, concat_kws, concat_kws2);

   keywords = [...new Set(keywords)];
   return keywords;
}

function find_synonyms(keywords, synonyms) {
   var kw_to_synonyms = {};
   for (var synonym of synonyms) {
      for (var kw of synonym) {
         kw_to_synonyms[kw] = synonym;
      }
   }

   new_keywords = [];
   for (var kw of keywords) {
      if (Object.keys(kw_to_synonyms).includes(kw)) {
         new_keywords.push(...kw_to_synonyms[kw]);
      }
   }

   return [...new Set(new_keywords)];
}

// There are changes made in the below global variables
var suffixes = ["ing", "d", "ed", "s", ""];
var endings = [",", ".", "!", "\n", "/", ")", "-", " ", ";"];
var beginnings = ["\n", " ", "/", "(", "-"];
function highlight_single_elm(elm, keywords, color) {
   for (var i = 0; i < elm.childNodes.length; i++) {
      var child = elm.childNodes[i];

      if (is_text_node(child)) {
         for (var kw of keywords) {
            /* The keywords change below are for keywords getting 
        highlighted inside a word. */

            if (child.nodeValue == null) {
               continue;
            }

            // Replaced go with zz in job description and then Lower cased everything
            var goText = child.nodeValue;
            goText = goText.replace(" go ", " zz ");
            var text = goText.toLowerCase();

            suffixes.forEach((suffix) => {
               endings.forEach((end) => {
                  beginnings.forEach((begin) => {
                     var to_match = kw + suffix;

                     if (text != null) {
                        var full_match = begin + to_match + end;

                        var start_match = to_match + end;

                        var end_match = begin + to_match;

                        if (text.includes(full_match)) {
                           highlight_substr(child, full_match, color);
                           return false;
                        } else if (
                           text.substr(-end_match.length) == end_match
                        ) {
                           highlight_substr(child, end_match, color);
                           return false;
                        } else if (
                           text.substr(0, start_match.length) == start_match
                        ) {
                           highlight_substr(child, start_match, color);
                           return false;
                        } else if (text == to_match) {
                           highlight_substr(child, to_match, color);
                        }
                     }
                  });
               });
            });
         }
      }
   }
   return true;
}

function highlight_substr(textNode, substring, color) {
   debug_log("highlighting " + textNode + " with substring " + substring);
   var text = textNode.nodeValue;
   var idx = text.toLowerCase().indexOf(substring);
   var midNode = create_highlight_elm(color);
   midNode.appendChild(
      document.createTextNode(text.substr(idx, substring.length))
   );
   var leftNode = document.createTextNode(text.substr(0, idx));
   var rightNode = document.createTextNode(text.substr(idx + substring.length));

   var elm = textNode.parentElement;

   elm.insertBefore(rightNode, textNode.nextSibling);
   elm.insertBefore(midNode, textNode.nextSibling);
   elm.insertBefore(leftNode, textNode.nextSibling);
   textNode.nodeValue = null;
}

// Function created for highlighting
function create_highlight_elm(color) {
   let url = "hired.recruitics.com";

   if (window.location.hostname === url) {
      // Highlight lines were little off in the original code for the url.
      var node = document.createElement("MARK");
      node.style.backgroundColor = "transparent";
      node.style.textDecoration = "underline";
      node.style.textDecorationColor = color;
      node.style.textDecorationThickness = "3px";
      node.style.textUnderlineOffset = "1px";
   } else {
      // original code
      var node = document.createElement("span");
      node.style.backgroundColor = "transparent";
      node.style.borderBottom = "3px solid";
      node.style.borderBottomColor = color;
   }

   return node;
}
