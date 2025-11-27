function initializeContentScript() {
  console.log('Job Info Extractor content script loaded');

  chrome.runtime.sendMessage({action: "contentScriptLoaded"})
    .then(response => {
      console.log('contentScriptLoaded acknowledged:', response);
    })
    .catch(error => {
      console.error('Error sending contentScriptLoaded message:', error);
    });

  injectPickerScript(document);

  // Inject picker script into all iframes
  const iframes = document.getElementsByTagName('iframe');
  for (let i = 0; i < iframes.length; i++) {
    try {
      injectPickerScript(iframes[i].contentDocument);
    } catch (e) {
      console.warn('Cannot access iframe content:', e);
    }
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    if (request.action === "startPicking") {
      window.postMessage({ type: "FROM_CONTENT_SCRIPT", action: "startPicking", pick: request.pick }, "*");
      sendResponse({status: "Picking started"});
    } else if (request.action === "showNotification") {
      showNotification(request.text, request.isError);
    }
  });

  function showNotification(text, isError = false) {
    const notification = document.createElement('div');
    notification.textContent = text;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: ${isError ? '#dc3545' : '#28a745'};
      color: white;
      padding: 10px;
      border-radius: 5px;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  window.addEventListener("message", (event) => {
    if (event.data.type && event.data.type === "FROM_PICKER_SCRIPT") {
      console.log('Received from picker script:', event.data);
      if (event.data.action === "pickedElement") {
        if (event.data.text) {
          try {
            chrome.runtime.sendMessage({
              action: "pickedElement",
              text: event.data.text,
              pick: event.data.pick
            }).then(response => {
              console.log('Picked element sent successfully:', response);
              // Reopen the popup
              reopenPopup();
            }).catch(error => {
              console.error('Error sending picked element to background:', error);
              // If the extension context is invalidated, try to reload the content script
              if (error.message.includes("Extension context invalidated")) {
                console.log('Reloading content script...');
                initializeContentScript();
              }
            });
          } catch (error) {
            console.error('Error in content script:', error);
          }
        } else {
          console.log('No text selected, picking stopped');
        }
      } else if (event.data.action === "stopPicking") {
        // Propagate stop picking to all frames
        window.postMessage({ type: "FROM_CONTENT_SCRIPT", action: "stopPicking" }, "*");
      }
    }
  });
}

function injectPickerScript(doc) {
  const script = doc.createElement('script');
  script.src = chrome.runtime.getURL('picker.js');
  (doc.head || doc.documentElement).appendChild(script);
}

function reopenPopup() {
  chrome.runtime.sendMessage({action: "reopenPopup"})
    .then(() => console.log('Reopen popup message sent'))
    .catch(error => console.error('Error sending reopen popup message:', error));
}

initializeContentScript();