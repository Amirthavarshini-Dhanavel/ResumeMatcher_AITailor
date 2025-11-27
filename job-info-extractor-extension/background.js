let activeTabId = null;
let contentScriptInjected = new Set();

// Add these new variables for OAuth
let accessToken = null;
let tokenExpirationTime = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  console.log('Redirect URL:', chrome.identity.getRedirectURL());
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;
  clearStoredData();
  injectContentScriptIfNeeded(activeTabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tabId === activeTabId) {
    clearStoredData();
    injectContentScriptIfNeeded(tabId);
  }
});

function injectContentScriptIfNeeded(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://') && !tab.url.startsWith('about:') && !contentScriptInjected.has(tabId)) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).then(() => {
        contentScriptInjected.add(tabId);
        console.log('Content script injected in tab', tabId);
      }).catch(error => {
        console.error('Error injecting content script:', error);
        // Remove the tab from the injected set if injection fails
        contentScriptInjected.delete(tabId);
      });
    } else if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      console.log('Cannot inject content script into', tab.url);
    }
  });
}

function sendMessageToContentScript(message) {
  if (activeTabId) {
    chrome.tabs.sendMessage(activeTabId, message)
      .then(response => {
        console.log('Message sent successfully:', response);
      })
      .catch(error => {
        console.error('Error sending message:', error);
        // If the content script is not injected, inject it and try again
        injectContentScriptIfNeeded(activeTabId).then(() => {
          return chrome.tabs.sendMessage(activeTabId, message);
        }).catch(error => {
          console.error('Failed to inject content script and send message:', error);
        });
      });
  }
}

// Modify the existing getAccessToken function
function getAccessToken() {
  return new Promise((resolve, reject) => {
    console.log('getAccessToken called');
    if (accessToken && Date.now() < tokenExpirationTime) {
      console.log('Using cached token');
      resolve(accessToken);
    } else {
      console.log('Requesting new token');
      const clientId = '51374964571-bi04md6l0c2ccodatpmitnitiqu67f5a.apps.googleusercontent.com';
      const redirectUri = chrome.identity.getRedirectURL();
      console.log('Redirect URI:', redirectUri); // Add this line for debugging
      const scopes = encodeURIComponent('https://www.googleapis.com/auth/spreadsheets');
      const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;

      chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        (responseUrl) => {
          if (chrome.runtime.lastError) {
            console.error('Error in launchWebAuthFlow:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            const url = new URL(responseUrl);
            const hash = url.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get('access_token');
            if (token) {
              console.log('Received new token');
              accessToken = token;
              tokenExpirationTime = Date.now() + 3600000; // Token expires in 1 hour
              chrome.storage.sync.set({ isAuthenticated: true }, function() {
                console.log('Authentication status saved');
              });
              resolve(token);
            } else {
              reject(new Error('Failed to obtain access token'));
            }
          }
        }
      );
    }
  });
}

// Modify the existing message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  if (request.action === "getAccessToken") {
    console.log('getAccessToken message received');
    getAccessToken()
      .then(token => {
        console.log('Token retrieved successfully');
        sendResponse({ token: token });
      })
      .catch(error => {
        console.error('Error retrieving token:', error);
        sendResponse({ error: error.message });
      });
    return true; // Indicates that the response will be sent asynchronously
  }
  if (request.action === "contentScriptLoaded") {
    console.log("Content script loaded in tab", sender.tab.id);
    sendResponse({status: "acknowledged"});
  } else if (request.action === "startPicking") {
    sendMessageToContentScript(request);
  } else if (request.action === "pickedElement") {
    chrome.storage.local.get(['jobTitle', 'company'], (result) => {
      let updatedData = result;
      if (request.pick === 'title') {
        updatedData.jobTitle = request.text;
      } else if (request.pick === 'company') {
        updatedData.company = request.text;
      }
      chrome.storage.local.set(updatedData, () => {
        console.log('Picked element stored:', updatedData);
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "showNotification",
          text: `${request.pick.charAt(0).toUpperCase() + request.pick.slice(1)} picked: ${request.text}`
        }).catch(error => console.error('Error showing notification:', error));
        updatePopup(updatedData);
        // Reopen the popup
        chrome.action.openPopup()
          .then(() => console.log('Popup reopened'))
          .catch(error => console.error('Error opening popup:', error));
      });
    });
  } else if (request.action === "reopenPopup") {
    chrome.action.openPopup()
      .then(() => console.log('Popup reopened'))
      .catch(error => console.error('Error opening popup:', error));
  }
  return true; // Indicates that the response will be sent asynchronously
});

// Add this new listener
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(['pickedElement', 'pickedElementType'], (result) => {
    if (result.pickedElement && result.pickedElementType) {
      chrome.runtime.sendMessage({
        action: "updatePopup",
        text: result.pickedElement,
        pick: result.pickedElementType
      });
    }
  });
});

function updatePopup(data) {
  chrome.runtime.sendMessage({
    action: "updatePopup",
    jobTitle: data.jobTitle,
    company: data.company
  }).catch(error => console.error('Error updating popup:', error));
}

function clearStoredData() {
  chrome.storage.local.remove(['jobTitle', 'company'], () => {
    console.log('Cleared stored job data');
  });
}

// Add this function
function getSheetId() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['sheetId'], function(result) {
      if (result.sheetId) {
        resolve(result.sheetId);
      } else {
        reject(new Error('No Sheet ID found'));
      }
    });
  });
}

// Modify the existing message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // ... (existing code)

  if (request.action === "getSheetId") {
    getSheetId()
      .then(sheetId => sendResponse({sheetId: sheetId}))
      .catch(error => sendResponse({error: error.message}));
    return true;
  }

  if (request.action === "fetchSheetNames") {
    getAccessToken().then(token => {
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${request.sheetId}?fields=sheets.properties.title`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error.message);
        }
        const sheetNames = data.sheets.map(sheet => sheet.properties.title);
        console.log('Fetched sheet names:', sheetNames);
        sendResponse({sheetNames: sheetNames});
      })
      .catch(error => {
        console.error('Error fetching sheet names:', error);
        sendResponse({error: error.message});
      });
    }).catch(error => {
      console.error('Error getting access token:', error);
      sendResponse({error: 'Failed to get access token'});
    });
    return true;  // Will respond asynchronously
  }

  if (request.action === "showColumnConfig") {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "showColumnConfig",
      sheetNames: request.sheetNames
    });
    return true;
  }

  // ... (existing code)
});

// Heuristic extraction from page (runs in page context via executeScript)
function extractJobFromDom() {
  function pick(selectorList) {
    for (const sel of selectorList) {
      const el = document.querySelector(sel);
      if (el && el.textContent && el.textContent.trim()) {
        return el.textContent.trim();
      }
    }
    return "";
  }
  const title = pick([
    "h1", "[data-test='jobTitle']", "[data-automation='jobTitle']",
    ".jobsearch-JobInfoHeader-title", ".topcard__title", "[itemprop='title']"
  ]);
  const company = pick([
    ".topcard__org-name-link", "[data-test='employerName']", "[itemprop='hiringOrganization']",
    ".jobsearch-InlineCompanyRating div:nth-child(1)", ".icl-u-lg-mr--sm.icl-u-xs-mr--xs"
  ]);
  return { title, company, url: location.href };
}

// External messaging for orchestrator
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  try {
    if (msg && msg.type === "jie_extract_job") {
      const targetTabId = msg.tabId || activeTabId;
      if (!targetTabId) {
        sendResponse({ error: "no_active_tab" });
        return true;
      }
      // First use stored picks if available
      chrome.storage.local.get(["jobTitle", "company"], (stored) => {
        if (stored?.jobTitle || stored?.company) {
          sendResponse({
            title: stored.jobTitle || "",
            company: stored.company || "",
            url: sender?.tab?.url || ""
          });
        } else {
          // Fallback: extract heuristically from DOM
          chrome.scripting.executeScript({
            target: { tabId: targetTabId, allFrames: false },
            func: extractJobFromDom
          }).then((results) => {
            const r = (results && results[0] && results[0].result) || { title: "", company: "", url: "" };
            sendResponse(r);
          }).catch((e) => {
            sendResponse({ error: "extract_failed", detail: String(e && e.message || e) });
          });
        }
      });
      return true;
    }

    if (msg && msg.type === "jie_save_to_sheet") {
      const targetTabId = msg.tabId || activeTabId;
      const finalize = (data) => {
        chrome.storage.sync.get(['sheetId', 'sheetConfig'], (cfg) => {
          if (!cfg.sheetId || !cfg.sheetConfig) {
            sendResponse({ ok: false, error: "sheet_not_configured" });
            return;
          }
          const payload = {
            action: "moveDataToSheet",
            sheetId: cfg.sheetId,
            sheetConfig: cfg.sheetConfig,
            jobTitle: data.title || "",
            company: data.company || "",
            url: data.url || ""
          };
          // Reuse existing internal handler
          moveDataToSheet(payload, (resp) => {
            sendResponse({ ok: !!resp?.success, error: resp?.error });
          });
        });
      };

      if (!targetTabId) {
        sendResponse({ ok: false, error: "no_active_tab" });
        return true;
      }

      // Prefer stored picks if present
      chrome.storage.local.get(["jobTitle", "company"], (stored) => {
        if (stored?.jobTitle || stored?.company) {
          finalize({ title: stored.jobTitle || "", company: stored.company || "", url: msg.jobUrl || "" });
        } else {
          // Heuristic scrape
          chrome.scripting.executeScript({
            target: { tabId: targetTabId, allFrames: false },
            func: extractJobFromDom
          }).then((results) => {
            const r = (results && results[0] && results[0].result) || { title: "", company: "", url: "" };
            finalize(r);
          }).catch((e) => {
            sendResponse({ ok: false, error: "extract_failed" });
          });
        }
      });
      return true;
    }
  } catch (e) {
    try { sendResponse({ ok: false, error: "jie_external_error" }); } catch {}
  }
});

// Add this function to handle extension reset
function resetExtension() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.clear(() => {
      chrome.storage.local.clear(() => {
        chrome.identity.removeCachedAuthToken({ token: accessToken }, () => {
          accessToken = null;
          tokenExpirationTime = null;
          console.log('Extension reset completed');
          resolve();
        });
      });
    });
  });
}

// Add this to the message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // ... (existing code)
  if (request.action === "resetExtension") {
    resetExtension()
      .then(() => sendResponse({ status: "success" }))
      .catch(error => sendResponse({ status: "error", message: error.message }));
    return true;
  }
  // ... (existing code)
});

// Add this function to handle fetching sheet names
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // ... (existing code)

  if (request.action === "fetchSheetNames") {
    getAccessToken().then(token => {
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${request.sheetId}?fields=sheets.properties.title`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error.message);
        }
        const sheetNames = data.sheets.map(sheet => sheet.properties.title);
        console.log('Fetched sheet names:', sheetNames);
        sendResponse({sheetNames: sheetNames});
      })
      .catch(error => {
        console.error('Error fetching sheet names:', error);
        sendResponse({error: error.message});
      });
    }).catch(error => {
      console.error('Error getting access token:', error);
      sendResponse({error: 'Failed to get access token'});
    });
    return true;  // Will respond asynchronously
  }

});

// Add this function to handle moving data to the sheet
function moveDataToSheet(request, sendResponse) {
  console.log('moveDataToSheet called with request:', request);
  getAccessToken().then(token => {
    console.log('Access token obtained');
    const { sheetId, sheetConfig, jobTitle, company, url } = request;
    const sheetName = sheetConfig.sheetName;
    const range = `${sheetName}!A:D`;  // Changed to include column D

    console.log('Fetching last row for range:', range);
    // First, get the last row
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?majorDimension=ROWS`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Last row data:', data);
      const lastRow = data.values ? data.values.length + 1 : 1;
      
      // Create an array to hold the data, initialized with empty strings
      const rowData = ['', '', '', ''];
      
      // Map the data to the correct columns
      rowData[sheetConfig.jobTitleColumn.charCodeAt(0) - 65] = jobTitle;
      rowData[sheetConfig.companyColumn.charCodeAt(0) - 65] = company;
      rowData[sheetConfig.urlColumn.charCodeAt(0) - 65] = url;

      // Determine the start and end columns for the update range
      const startColumn = Math.min(sheetConfig.jobTitleColumn.charCodeAt(0), sheetConfig.companyColumn.charCodeAt(0), sheetConfig.urlColumn.charCodeAt(0));
      const endColumn = Math.max(sheetConfig.jobTitleColumn.charCodeAt(0), sheetConfig.companyColumn.charCodeAt(0), sheetConfig.urlColumn.charCodeAt(0));
      
      const updateRange = `${sheetName}!${String.fromCharCode(startColumn)}${lastRow}:${String.fromCharCode(endColumn)}${lastRow}`;
      console.log('Updating range:', updateRange);

      // Now, update the sheet with the new data
      const updateData = {
        range: updateRange,
        majorDimension: "ROWS",
        values: [rowData.slice(startColumn - 65, endColumn - 64)]  // Only include the columns we're updating
      };
      console.log('Sending update data:', updateData);

      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error('Error updating sheet:', data.error);
          sendResponse({success: false, error: data.error.message});
        } else {
          console.log('Sheet updated successfully. Response:', data);
          sendResponse({success: true, data: data});
        }
      })
      .catch(error => {
        console.error('Error updating sheet:', error);
        sendResponse({success: false, error: error.message});
      });
    })
    .catch(error => {
      console.error('Error getting last row:', error);
      sendResponse({success: false, error: error.message});
    });
  }).catch(error => {
    console.error('Error getting access token:', error);
    sendResponse({success: false, error: error.message});
  });
  return true; // Will respond asynchronously
}

// Modify the existing message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // ... (existing code)

  if (request.action === "moveDataToSheet") {
    console.log('Received moveDataToSheet request in background script:', request);
    moveDataToSheet(request, sendResponse);
    return true; // Will respond asynchronously
  }

  // ... (existing code)
});