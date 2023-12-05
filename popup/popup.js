const sendButton = document.getElementById('sendButton');

sendButton.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ action: 'getPageContent' });
  // UI update is now handled by the new listener
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'response') {
    const response = message.data;

    // Update UI based on the response
    if (response && response.status === 'ok') {
      document.getElementById('sendButton').classList.add('disabled:bg-green-700'); // Add to the className
      document.querySelector('#content').textContent = 'Saved!';
      document.querySelector('#bookmark-icon').style.display = 'none';
      document.querySelector('#checked-icon').style.display = '';
    }
    else if (response && response.status === 'resave') {
      document.querySelector('#content').textContent = 'Already Saved!';
      document.querySelector('#bookmark-icon').style.display = 'none';
      document.querySelector('#checked-icon').style.display = '';
    }
    else {
      document.getElementById('sendButton').classList.add('disabled:bg-red-400'); // Add to the className
      document.querySelector('#content').textContent = 'Error!';
      document.querySelector('#bookmark-icon').style.display = 'none';
      document.querySelector('#failed-icon').style.display = '';
    }

    // Disable the send button after the response is handled
    document.getElementById('sendButton').disabled = true;
  }
});