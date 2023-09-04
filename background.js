let getCurrentTab = async function() {
  let tabs = await chrome.tabs.query(
    {
      active: true,
      currentWindow: true
    }
  );
  let activeTab = tabs[0];
  console.log("Getting active tab")
  return activeTab;
}

let getPageContent = async function() {
  let tab = await getCurrentTab();
  const pageInfo = await chrome.tabs.sendMessage(tab.id, {action: 'getPageContent'})

  return {pageInfo: pageInfo.content, tab: tab};
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Message received to save the page.
  if (request.action === 'getPageContent') {
    getPageContent()
      .then(async response => {
        let tab = response.tab;
        let pageContent = response.pageInfo;

        // Send POST request to API endpoint
        // const apiResponse = await fetch('http://localhost:8000/healthcheck', {
          const apiResponse = await fetch('https://stunning-cheerful-adder.ngrok-free.app/api/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + await getJWT()
          },
          body: JSON.stringify({
            pageData: {
              url: tab.url,
              title: tab.title,
              content: pageContent
            }
          })
        });

        return apiResponse.json();
      })
      .then(data => {
        sendResponse(data);
      })
      .catch(error => {
        console.error("Error in background script:", error);
        sendResponse({ status: 'error', message: error.message });
      });

    return true; // Indicate we'll respond asynchronously
  }
});


async function getJWT() {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({url: 'https://app.nous.fyi', name: 'jwt'}, (cookie) => {
      if (cookie) {
        resolve(cookie.value);
      } else {
        reject('No JWT cookie found');
      }
    });
  });
}