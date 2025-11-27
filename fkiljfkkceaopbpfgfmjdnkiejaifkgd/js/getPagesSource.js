// import { crawl_elm } from "./crawler";
var highlight = false;

var crawl_result = crawl_elm(document);
var flattened = "";
for (const text of crawl_result["saved"]) {
   if (text.trim() != "") {
      flattened += text + "\n";
   }
}

chrome.runtime.sendMessage({
   action: "getSource",
   source: flattened,
});

if (highlight) {
   var backgrounds = highlight_crawl_result(crawl_result);
   function clear_highlights() {
      for (var elm_and_color of backgrounds) {
         elm_and_color[0].style.backgroundColor = elm_and_color[1];
      }
      document.body.removeEventListener("mousedown", clear_highlights);
   }

   document.body.addEventListener("mousedown", clear_highlights);
}
