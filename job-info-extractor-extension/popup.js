(function() {
  let currentPick = null;

  document.addEventListener('DOMContentLoaded', function() {
    const pickTitleBtn = document.getElementById('pickTitleBtn');
    const pickCompanyBtn = document.getElementById('pickCompanyBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const moveToSheetBtn = document.getElementById('moveToSheetBtn');
    const jobTitleSpan = document.getElementById('jobTitle');
    const companySpan = document.getElementById('company');
    const urlSpan = document.getElementById('url');
    const configureSheetBtn = document.getElementById('configureSheetBtn');
    const sheetConfigDiv = document.getElementById('sheetConfig');
    const sheetIdInput = document.getElementById('sheetId');
    const submitSheetIdBtn = document.getElementById('submitSheetId');
    const columnConfigDiv = document.getElementById('columnConfig');
    const saveConfigBtn = document.getElementById('saveConfig');
    const resetBtn = document.getElementById('resetBtn');
    const authBtn = document.getElementById('authBtn');
    const mainInterface = document.getElementById('mainInterface');

    // Hide all elements initially
    hideAllExcept([authBtn, resetBtn]);

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      urlSpan.textContent = tabs[0].url;
    });

    authBtn.addEventListener('click', authenticateWithGoogle);
    configureSheetBtn.addEventListener('click', function() {
      console.log('Configure Sheet button clicked');
      showSheetConfig();
    });
    submitSheetIdBtn.addEventListener('click', submitSheetId);
    saveConfigBtn.addEventListener('click', saveColumnConfig);
    resetBtn.addEventListener('click', resetExtension);

    pickTitleBtn.addEventListener('click', () => startPicking('title'));
    pickCompanyBtn.addEventListener('click', () => startPicking('company'));

    confirmBtn.addEventListener('click', () => {
      console.log('Selection confirmed');
      chrome.storage.local.get(['jobTitle', 'company'], function(result) {
        if (result.jobTitle && result.company) {
          showNotification('Selection confirmed: ' + result.jobTitle + ' at ' + result.company);
          
          // Hide the confirm button
          confirmBtn.style.display = 'none';
          
          // Enable and show the Move to Sheet button
          moveToSheetBtn.disabled = false;
          moveToSheetBtn.style.display = 'block';
          
          // Update the displayed information
          updateDisplayedInfo();
        } else {
          showNotification('Please pick both job title and company before confirming.', true);
        }
      });
    });

    moveToSheetBtn.addEventListener('click', moveDataToSheet);

    // Check if user is already authenticated and sheet is configured
    checkSavedDataAndUpdateUI();

    function checkSavedDataAndUpdateUI() {
      chrome.storage.sync.get(['isAuthenticated', 'sheetId', 'sheetConfig'], function(result) {
        if (result.isAuthenticated) {
          authBtn.style.display = 'none';
          if (result.sheetId && result.sheetConfig) {
            showMainInterface();
          } else {
            configureSheetBtn.style.display = 'block';
          }
        }
      });
    }

    function authenticateWithGoogle() {
      chrome.runtime.sendMessage({action: "getAccessToken"}, function(response) {
        if (response && response.token) {
          showNotification('Successfully authenticated with Google');
          authBtn.style.display = 'none';
          configureSheetBtn.style.display = 'block';
        } else {
          console.error('Failed to get access token:', response ? response.error : 'No response');
          showNotification('Failed to authenticate with Google. Please try again.', true);
        }
      });
    }

    function showSheetConfig() {
      hideAllExcept([sheetConfigDiv, resetBtn]);
      sheetIdInput.style.display = 'block';
      submitSheetIdBtn.style.display = 'block';
      columnConfigDiv.style.display = 'none';

      // Load and display the saved sheet ID
      chrome.storage.sync.get(['sheetId'], function(result) {
        if (result.sheetId) {
          sheetIdInput.value = result.sheetId;
        }
      });
    }

    function submitSheetId() {
      const sheetId = sheetIdInput.value.trim();
      if (!sheetId) {
        showNotification('Please enter a valid Sheet ID', true);
        return;
      }

      // Basic validation for Google Sheets ID format
      const sheetIdRegex = /^[a-zA-Z0-9-_]+$/;
      if (!sheetIdRegex.test(sheetId)) {
        showNotification('Invalid Sheet ID format. Please check and try again.', true);
        return;
      }

      chrome.storage.sync.set({sheetId: sheetId}, function() {
        if (chrome.runtime.lastError) {
          console.error('Error saving sheet ID:', chrome.runtime.lastError);
          showNotification('Error saving Sheet ID. Please try again.', true);
        } else {
          console.log('Sheet ID saved successfully:', sheetId);
          showNotification('Sheet ID saved. Fetching sheet names...');
          fetchSheetNames(sheetId);
        }
      });
    }

    function fetchSheetNames(sheetId) {
      console.log('Fetching sheet names for ID:', sheetId);
      chrome.runtime.sendMessage({action: "fetchSheetNames", sheetId: sheetId}, function(response) {
        console.log('Received response:', response);
        if (chrome.runtime.lastError) {
          console.error('Error fetching sheet names:', chrome.runtime.lastError);
          showNotification('Error fetching sheet names. Please try again.', true);
        } else if (response && response.sheetNames) {
          console.log('Sheet names received:', response.sheetNames);
          populateSheetDropdown(response.sheetNames);
          showColumnConfig();
        } else if (response && response.error) {
          console.error('Error fetching sheet names:', response.error);
          showNotification('Failed to fetch sheet names. Please check if the Sheet ID is correct and you have access to the sheet.', true);
        } else {
          console.error('Invalid response:', response);
          showNotification('Unexpected error. Please try again.', true);
        }
      });
    }

    function populateSheetDropdown(sheetNames) {
      console.log('Populating sheet dropdown with:', sheetNames);
      const sheetSelect = document.getElementById('sheetSelect');
      if (!sheetSelect) {
        console.error('Sheet select element not found');
        return;
      }
      sheetSelect.innerHTML = '';
      sheetNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        sheetSelect.appendChild(option);
      });
      console.log('Sheet dropdown populated');
    }

    function showColumnConfig() {
      console.log('Showing column config');
      hideAllExcept([columnConfigDiv, resetBtn]);
      
      // Ensure all elements within columnConfigDiv are visible
      const elementsToShow = [
        'sheetSelect',
        'jobTitleColumn',
        'companyColumn',
        'urlColumn',
        'saveConfig'
      ];

      elementsToShow.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.style.display = 'block';
        } else {
          console.error(`Element with id '${id}' not found in showColumnConfig`);
        }
      });

      // Make sure the labels and their parent divs are visible
      const labels = columnConfigDiv.querySelectorAll('label');
      labels.forEach(label => {
        label.style.display = 'block';
        if (label.parentElement) {
          label.parentElement.style.display = 'block';
        }
      });

      // Explicitly set input fields to display: block
      document.getElementById('jobTitleColumn').style.display = 'block';
      document.getElementById('companyColumn').style.display = 'block';
      document.getElementById('urlColumn').style.display = 'block';

      // Load saved configuration if it exists
      chrome.storage.sync.get(['sheetConfig'], function(result) {
        if (result.sheetConfig) {
          const sheetSelect = document.getElementById('sheetSelect');
          if (sheetSelect) sheetSelect.value = result.sheetConfig.sheetName || '';
          document.getElementById('jobTitleColumn').value = result.sheetConfig.jobTitleColumn || '';
          document.getElementById('companyColumn').value = result.sheetConfig.companyColumn || '';
          document.getElementById('urlColumn').value = result.sheetConfig.urlColumn || '';
        }
      });

      columnConfigDiv.style.display = 'block';
    }

    function saveColumnConfig() {
      const sheetName = document.getElementById('sheetSelect').value;
      const jobTitleColumnValue = document.getElementById('jobTitleColumn').value.trim().toUpperCase();
      const companyColumnValue = document.getElementById('companyColumn').value.trim().toUpperCase();
      const urlColumnValue = document.getElementById('urlColumn').value.trim().toUpperCase();

      // Validation
      if (!sheetName) {
        showNotification('Please select a sheet.', true);
        return;
      }

      if (!jobTitleColumnValue || !companyColumnValue || !urlColumnValue) {
        showNotification('Please fill in all column fields.', true);
        return;
      }

      // Check if the column values are valid spreadsheet column letters (A-Z, AA-ZZ, etc.)
      const columnRegex = /^[A-Z]+$/;
      if (!columnRegex.test(jobTitleColumnValue) || !columnRegex.test(companyColumnValue) || !columnRegex.test(urlColumnValue)) {
        showNotification('Column values must be valid spreadsheet column letters (e.g., A, B, AA, AB).', true);
        return;
      }

      const config = {
        sheetName: sheetName,
        jobTitleColumn: jobTitleColumnValue,
        companyColumn: companyColumnValue,
        urlColumn: urlColumnValue
      };

      chrome.storage.sync.set({sheetConfig: config}, function() {
        showNotification('Sheet configuration saved successfully');
        showMainInterface();
      });
    }

    function showMainInterface() {
      hideAllExcept([mainInterface, resetBtn, configureSheetBtn]);
      configureSheetBtn.textContent = 'Update Sheet Configuration';
      pickTitleBtn.style.display = 'block';
      pickCompanyBtn.style.display = 'block';
      
      // Display the result div after the Pick Company Name button
      const resultDiv = document.getElementById('result');
      pickCompanyBtn.insertAdjacentElement('afterend', resultDiv);
      resultDiv.style.display = 'block';
      
      confirmBtn.style.display = 'block';
      moveToSheetBtn.style.display = 'block';
      
      // Update the displayed information
      updateDisplayedInfo();
    }

    function updateDisplayedInfo() {
      const jobTitleSpan = document.getElementById('jobTitle');
      const companySpan = document.getElementById('company');
      const urlSpan = document.getElementById('url');
      const confirmBtn = document.getElementById('confirmBtn');
      const moveToSheetBtn = document.getElementById('moveToSheetBtn');
      
      chrome.storage.local.get(['jobTitle', 'company'], function(result) {
        jobTitleSpan.textContent = result.jobTitle || '';
        companySpan.textContent = result.company || '';
        
        // Show confirm button if both job title and company are picked and not yet confirmed
        if (result.jobTitle && result.company && confirmBtn.style.display !== 'none') {
          confirmBtn.disabled = false;
          confirmBtn.style.display = 'block';
          moveToSheetBtn.disabled = true;
          moveToSheetBtn.style.display = 'none';
        } else if (confirmBtn.style.display === 'none') {
          // If already confirmed, keep confirm button hidden and move to sheet button enabled
          moveToSheetBtn.disabled = false;
          moveToSheetBtn.style.display = 'block';
        } else {
          // If not all data is picked, disable and hide both buttons
          confirmBtn.disabled = true;
          confirmBtn.style.display = 'none';
          moveToSheetBtn.disabled = true;
          moveToSheetBtn.style.display = 'none';
        }
      });
      
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        urlSpan.textContent = tabs[0].url;
      });
    }

    function startPicking(type) {
      currentPick = type;
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "startPicking", pick: type});
      });
      window.close(); // Close the popup to allow interaction with the page
    }

    function moveDataToSheet() {
      chrome.storage.sync.get(['sheetId', 'sheetConfig'], function(result) {
        if (result.sheetId && result.sheetConfig) {
          const data = {
            action: "moveDataToSheet",
            sheetId: result.sheetId,
            sheetConfig: result.sheetConfig,
            jobTitle: jobTitleSpan.textContent,
            company: companySpan.textContent,
            url: urlSpan.textContent
          };
          console.log('Sending data to background script:', data);
          chrome.runtime.sendMessage(data, function(response) {
            console.log('Received response from background script:', response);
            if (response && response.success) {
              showNotification('Data moved to sheet successfully');
            } else {
              const errorMessage = response && response.error ? response.error : 'Unknown error occurred';
              showNotification(`Failed to move data to sheet: ${errorMessage}`, true);
              console.error('Error moving data to sheet:', errorMessage);
            }
          });
        } else {
          showNotification('Please configure the sheet first', true);
          console.error('Sheet not configured. sheetId:', result.sheetId, 'sheetConfig:', result.sheetConfig);
        }
      });
    }
  });

  function hideAllExcept(elementsToShow) {
    const allElements = document.querySelectorAll('button, div, input');
    allElements.forEach(el => el.style.display = 'none');
    elementsToShow.forEach(el => {
      if (el) el.style.display = 'block';
    });
  }

  function resetExtension() {
    if (confirm('Are you sure you want to reset the extension? This will clear all saved data and log you out.')) {
      chrome.runtime.sendMessage({action: "resetExtension"}, function(response) {
        if (response && response.status === "success") {
          chrome.storage.sync.clear();
          chrome.storage.local.clear();
          hideAllExcept([document.getElementById('authBtn'), document.getElementById('resetBtn')]);
          showNotification('Extension has been reset. Please refresh the page to complete the process.');
        } else {
          console.error('Failed to reset extension:', response ? response.message : 'No response');
          showNotification('Failed to reset extension. Please try again.', true);
        }
      });
    }
  }

  function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      background: ${isError ? '#dc3545' : '#28a745'};
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      text-align: center;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updatePopup") {
      if (request.jobTitle) document.getElementById('jobTitle').textContent = request.jobTitle;
      if (request.company) document.getElementById('company').textContent = request.company;
      
      // Update the displayed information, which will handle button states
      updateDisplayedInfo();
    }
  });

  // Call updateDisplayedInfo when the popup is opened
  document.addEventListener('DOMContentLoaded', function() {
    // ... (existing code)
    
    updateDisplayedInfo();
    
    // ... (existing code)
  });
})();