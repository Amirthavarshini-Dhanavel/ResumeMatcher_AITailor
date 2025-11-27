import { DebugPrinter, generate_uuid } from "./util.js";
import { storage, ref, uploadBytes } from "../dist/firebase-bundle.js";

function trackEvent(eventName, eventAction, eventParams) {
   // console.log("Tracking event", eventName, eventParams, clientId);
   const gTag = "G-GW4YJG7SK9";
   const streamId = "11246422975";
   const API_KEY = "eQeIPlmqTI2yXB8Lr8qFUg";
   chrome.storage.local.get("ga_client_id", (data) => {
      const clientId = data.ga_client_id || crypto.randomUUID();
      if (!data.ga_client_id) {
         chrome.storage.local.set({ ga_client_id: clientId });
      }
      fetch(
         `https://www.google-analytics.com/debug/mp/collect?measurement_id=${gTag}&api_secret=${API_KEY}`,
         {
            method: "POST",
            body: JSON.stringify({
               client_id: clientId, // or generate using uuidv4()
               events: [
                  {
                     name: eventName,
                     params: {
                        ...eventParams,
                        action: eventAction,
                        event_name: eventName,
                        extension_event: true,
                        session_id: Math.floor(Date.now() / 1000),
                        engagement_time_msec: "100",
                     },
                  },
               ],
            }),
            headers: {
               "Content-Type": "application/json",
            },
         }
      );
   });
}

// Disabling autoDiscover so we can attach a dropzone manually
Dropzone.autoDiscover = false;

document.addEventListener(
   "DOMContentLoaded",

   function () {
      console.log("full page uploaded loaded");
      var debug_printer = new DebugPrinter();
      // trackEvent("upload_page", "view");
      initPrivacyPolicyLink();

      var resumeData = "";
      var resumeFile = null;
      var resumeFilename = "";

      function saveResumeThenRedirect() {
         setTimeout(function () {
            alert("Unable to contact server... Please check your connection");
         }, 10000);
         storeUserInfo(resumeFile, "", setResumeAndRedirect);
      }

      function setResumeAndRedirect() {
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
                  if (!debug_printer.on()) {
                     window.location.href = "/html/scanner.html";
                  } else {
                     debug_printer.log("not redirecting because in debug mode");
                  }
               }
            });
         } else {
            alert("error uploading resume. Please choose a docx or pdf file");
         }
      }

      console.log("Before error");
      var myDropzone = new Dropzone("#resume-upload-dropzone", {
         url: "/",
         paramName: "file",
         maxFiles: 1,
         dictDefaultMessage:
            "Drag & drop a <span class='allowed-file-type'>.pdf</span> or <span class='allowed-file-type'>.docx</span> resume here or <span class='browse-file'>browse</span>",
         dictInvalidFileType: "Invalid file type. Please use .pdf or .docx",
         clickable: true,
         acceptedFiles:
            "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
         accept: function (file, done) {
            trackEvent("resume_upload", "click");

            resumeFile = file;
            var ext = file.name.split(".").pop();
            resumeFilename = file.name;
            debug_printer.log("input file is: " + String(file));

            if (ext == "pdf") {
               debug_printer.log("detected pdf");
               var fileReader = new FileReader();

               fileReader.onload = function () {
                  debug_printer.log("pdf file content loaded");
                  var typedarray = new Uint8Array(this.result);

                  getText(typedarray).then(
                     function (text) {
                        console.log(
                           "pdf file parsed, resume data is now: " +
                              text.substring(0, 20) +
                              "..."
                        );
                        resumeData = text;
                        saveResumeThenRedirect();
                     },
                     function (reason) {
                        // Execute only when there is some error while reading pdf file
                        alert(
                           "Seems this file is broken, please upload another file"
                        );
                     }
                  );
               };

               debug_printer.log("starting to read pdf file");
               fileReader.readAsArrayBuffer(file);
            } else if (ext == "docx") {
               debug_printer.log("docx file detected");

               function setResumeData(result) {
                  console.log(
                     "done parsing docx file, contents are " +
                        result.value.substring(0, 20) +
                        "..."
                  );
                  var myResume = result.value;
                  resumeData = myResume;
                  saveResumeThenRedirect();
               }

               function readFileInputEventAsArrayBuffer(file, callback) {
                  var reader = new FileReader();

                  reader.onload = function (loadEvent) {
                     var arrayBuffer = loadEvent.target.result;
                     callback(arrayBuffer);
                  };

                  debug_printer.log("starting to parse docx file");
                  reader.readAsArrayBuffer(file);
               }

               readFileInputEventAsArrayBuffer(file, function (arrayBuffer) {
                  mammoth
                     .convertToHtml({ arrayBuffer: arrayBuffer })
                     .then(setResumeData)
                     .done();
               });
            }
         },
      });
   },
   false
);

// getText() function definition. This is the pdf reader function.
function getText(typedarray) {
   var pdf = pdfjsLib.getDocument(typedarray);
   return pdf.promise.then(function (pdf) {
      // get all pages text
      var maxPages = pdf._transport.pdfDocument.numPages;
      var countPromises = [];
      // collecting all page promises
      for (var j = 1; j <= maxPages; j++) {
         var page = pdf._transport.pdfDocument.getPage(j);
         var txt = "";

         countPromises.push(
            page.then(function (page) {
               // add page promise
               var textContent = page.getTextContent();

               return textContent.then(function (text) {
                  // return content promise
                  return text.items
                     .map(function (s) {
                        return s.str;
                     })
                     .join(""); // value page text
               });
            })
         );
      }

      // Wait for all pages and join text
      return Promise.all(countPromises).then(function (texts) {
         return texts.join("");
      });
   });
}

// function initializeFireBase() {
//    // Your web app's Firebase configuration
//    var firebaseConfig = {
//       apiKey: "AIzaSyAcAaHbimH9lfJ9nx3ma3OCEDKDI2URlIo",
//       authDomain: "jobalytics.firebaseapp.com",
//       databaseURL: "https://jobalytics.firebaseio.com",
//       projectId: "jobalytics",
//       storageBucket: "jobalytics.appspot.com",
//       messagingSenderId: "351217594342",
//       appId: "1:351217594342:web:3d299befebae6864f07027",
//       measurementId: "G-N7E5N8SE44",
//    };
//    // Initialize Firebase
//    firebase.initializeApp(firebaseConfig);
//    // firebase.analytics();
// }

function initPrivacyPolicyLink() {
   document
      .getElementById("privacy_policy")
      .addEventListener("click", function () {
         chrome.tabs.create({
            active: true,
            url: "http://jobalytics.co/privacy-policy?utm_source=app&utm_medium=privacy_policy",
         });
      });
}

function storeUserInfo(resume, email, then) {
   if (email != "") {
      // save email
      var db = firebase.firestore();
      db.collection("users")
         .add({
            email: email,
         })
         .then(function (docRef) {
            storeResume(resume, docRef.id, then);
         })
         .catch(function (error) {
            trackEvent("email_save_error", "error", error);
            storeResume(resume, null, then);
         });
   } else {
      storeResume(resume, null, then);
   }
}

function storeResume(file, path, then) {
   if (path == null || path == "") {
      path = "no_email_" + generate_uuid();
   }

   const storageRef = ref(storage, "resumes/" + path);

   uploadBytes(storageRef, file)
      .then(() => {
         then();
      })
      .catch((error) => {
         trackEvent("resume_save_error", "error", error);
         then();
      });
}
