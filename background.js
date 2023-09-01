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
  console.log(pageInfo.content)

  return {pageInfo: pageInfo.content, tab: tab};
}

chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
  // Message recieved to save the page.
  if (request.action === 'getPageContent') {
    try {
      let response = await getPageContent();
      let tab = response.tab;
      let pageContent = response.pageInfo;
      console.log(tab.url, tab.title, pageContent);
      
      // Send POST request to API endpoint
      fetch('http://localhost:8000/api', {
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
      })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => {
        console.error('Error:', error);
        sendResponse({status: 'error'});
      });
      sendResponse(response);
      console.log(response);
    } catch (error) {
      sendResponse({status: 'error'});
      console.log(error);
    }
  }
});

async function getJWT() {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({url: 'http://localhost:3000', name: 'jwt'}, (cookie) => {
      if (cookie) {
        resolve(cookie.value);
      } else {
        reject('No JWT cookie found');
      }
    });
  });
}