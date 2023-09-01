const sendButton = document.getElementById('sendButton');
// const userIdInput = document.getElementById('userIdInput');

sendButton.addEventListener('click', () => {
  // const userId = userIdInput.value;
  chrome.runtime.sendMessage({ action: 'getPageContent' }, (response) => {
    console.log(response)
    if (response.status === 'ok') {
      sendButton.textContent = 'Saved!';
      sendButton.disabled = true;
    } else {
      sendButton.textContent = 'Error!';
    }
    return true;
  });
});