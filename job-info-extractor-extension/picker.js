if (typeof isPickingActive === 'undefined') {
  let isPickingActive = false;
  let highlightedElement = null;
  let currentPick = null;

  function startPicking() {
    isPickingActive = true;
    document.body.style.cursor = 'crosshair';
    addEventListeners(window);
    // Add event listeners to all iframes
    const iframes = document.getElementsByTagName('iframe');
    for (let i = 0; i < iframes.length; i++) {
      try {
        addEventListeners(iframes[i].contentWindow);
      } catch (e) {
        console.warn('Cannot access iframe content:', e);
      }
    }
    console.log('Picking started');
  }

  function stopPicking() {
    isPickingActive = false;
    document.body.style.cursor = 'default';
    removeEventListeners(window);
    // Remove event listeners from all iframes
    const iframes = document.getElementsByTagName('iframe');
    for (let i = 0; i < iframes.length; i++) {
      try {
        removeEventListeners(iframes[i].contentWindow);
      } catch (e) {
        console.warn('Cannot access iframe content:', e);
      }
    }
    if (highlightedElement) {
      highlightedElement.style.outline = '';
      highlightedElement = null;
    }
    console.log('Picking stopped');
  }

  function addEventListeners(win) {
    win.addEventListener('mouseup', handleMouseUp, true);
    win.addEventListener('mouseover', highlightElement, true);
  }

  function removeEventListeners(win) {
    win.removeEventListener('mouseup', handleMouseUp, true);
    win.removeEventListener('mouseover', highlightElement, true);
  }

  function highlightElement(e) {
    if (!isPickingActive) return;
    if (highlightedElement) highlightedElement.style.outline = '';
    highlightedElement = e.target;
    highlightedElement.style.outline = '2px solid red';
  }

  function handleMouseUp(e) {
    if (!isPickingActive) return;
    e.preventDefault();
    e.stopPropagation();

    let text = '';
    const selection = e.view.getSelection();
    
    if (selection && selection.toString().trim()) {
      text = selection.toString().trim();
      console.log('Selected text:', text);
    } else if (e.target && e.target.textContent) {
      text = e.target.textContent.trim();
      console.log('Element text:', text);
    }

    if (text) {
      sendPickedElement(text);
    }
    
    // Always stop picking, even if no text was selected
    stopPicking();
    
    // Send message to stop picking in all contexts
    window.top.postMessage({ type: "FROM_PICKER_SCRIPT", action: "stopPicking" }, "*");
  }

  function sendPickedElement(text) {
    try {
      console.log('Sending picked element:', text);
      window.top.postMessage({ type: "FROM_PICKER_SCRIPT", action: "pickedElement", text: text, pick: currentPick }, "*");
    } catch (error) {
      console.error('Failed to send picked element:', error);
    }
  }

  window.addEventListener("message", (event) => {
    console.log('Message received in picker script:', event.data);
    if (event.data.type && event.data.type === "FROM_CONTENT_SCRIPT") {
      if (event.data.action === "startPicking") {
        console.log('Starting picking process');
        currentPick = event.data.pick;
        startPicking();
      } else if (event.data.action === "stopPicking") {
        stopPicking();
      }
    }
  });

  console.log('Picker script loaded');
}