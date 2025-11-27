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

var slideIndex = 1;

// Next/previous controls
function plusSlides(n) {
   showSlides((slideIndex += n));
}

// Thumbnail image controls
function currentSlide(n) {
   showSlides((slideIndex = n));
}

function showSlides(n) {
   var i;
   var slides = document.getElementsByClassName("mySlides");
   var dots = document.getElementsByClassName("dot");
   var captionText = document.getElementById("caption");
   if (n > slides.length) {
      slideIndex = 1;
   }
   if (n < 1) {
      slideIndex = slides.length;
   }
   for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
   }
   for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
   }
   slides[slideIndex - 1].style.display = "block";
   dots[slideIndex - 1].className += " active";

   var newText = dots[slideIndex - 1].children[0].cloneNode(true);
   newText.style.display = "block";

   while (captionText.firstChild) {
      captionText.removeChild(captionText.firstChild);
   }
   captionText.appendChild(newText);

   if (slideIndex == slides.length) {
      document.getElementById("got_it").style.display = "block";
   }
}

$(document).ready(function () {
   trackEvent("howto", "view");

   document.getElementsByClassName("next")[0].onclick = function () {
      plusSlides(1);
   };
   document.getElementsByClassName("prev")[0].onclick = function () {
      plusSlides(-1);
   };

   document.getElementById("got_it").onclick = function () {
      trackEvent("howto", "click_got_it");

      chrome.storage.local.set({ onboarded: true }, function () {
         window.location.href = "/html/scanner.html";
      });
   };

   showSlides(slideIndex);
});
