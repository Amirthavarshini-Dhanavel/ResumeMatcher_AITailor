function pdfParser(typedarray) {
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

               console.log("text content");
               console.dir(textContent, { maxStringLength: Infinity });

               return textContent.then(function (text) {
                  // return content promise
                  debugger;
                  return text.items
                     .map(function (s) {
                        return s.str;
                     })
                     .join(" "); // value page text
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

function docxParser(setResumeData) {
   readFileInputEventAsArrayBuffer(event, function (arrayBuffer) {
      mammoth
         .convertToHtml({ arrayBuffer: arrayBuffer })
         .then(setResumeData)
         .done();
   });

   function readFileInputEventAsArrayBuffer(event, callback) {
      var file = event.target.files[0];

      var reader = new FileReader();

      reader.onload = function (loadEvent) {
         var arrayBuffer = loadEvent.target.result;
         callback(arrayBuffer);
      };

      //debug_printer.log("starting to parse docx file")
      reader.readAsArrayBuffer(file);
   }
}

export { pdfParser, docxParser };
