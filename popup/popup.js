const sendButton = document.getElementById('sendButton');

sendButton.addEventListener('click', async () => {
  const response = await chrome.runtime.sendMessage({ action: 'getPageContent' });
  console.log(response);
  if (response && response.status === 'ok') {
    sendButton.textContent = 'Saved!';
  }
  else {
    sendButton.textContent = 'Error!';
  }
  sendButton.disabled = true;

  return true;
});