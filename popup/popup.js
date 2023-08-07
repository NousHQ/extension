document.getElementById('sendButton').addEventListener('click', function() {
  chrome.runtime.sendMessage({ action: 'getPageContent' }
    // Button is pressed. User wants to save the page.
    // Message is sent to background script to save the page.
    );
});