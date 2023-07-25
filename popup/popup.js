document.getElementById('sendButton').addEventListener('click', function() {
  chrome.runtime.sendMessage({ action: 'getPageContent' }, function(response) {
    if (response.status === 'OK') {
      let pageContent = response.data;

      chrome.runtime.sendMessage({ action: 'sendDataToAPI', data: pageContent }, function(response) {
        if (response.status === 'OK') {
          console.log(response.data);
        }
        else if (response.status === 'ERROR') {
          console.log(response.error);
        }
      });
    }
  });
});
