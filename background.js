let pageContent = {};
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'storePageContent') {
    pageContent = request.data;
    sendResponse({status: 'OK'});
  }
  if (request.action === 'getPageContent') {
    sendResponse({status: 'OK', data: pageContent});
  }
  if (request.action === 'sendDataToAPI') {
    fetch('http://localhost:8000/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.data)
    })
      .then(response => response.json())
      .then(data => sendResponse({ status: 'OK', data }))
      .catch(error => sendResponse({ status: 'ERROR', error }));
      console.log('request.data', request.data);
    return true;
  }
});
