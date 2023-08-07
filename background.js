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
  console.log(pageInfo)

  return {pageInfo: pageInfo, tab: tab};
}

chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
  // Message recieved to save the page.
  if (request.action === 'getPageContent') {
    let response = await getPageContent();
    let tab = response.tab;
    let pageContent = response.pageInfo;
    console.log(tab.url, tab.title, pageContent);
    
    // Send POST request to API endpoint
    fetch('http://localhost:8000/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: tab.url,
        title: tab.title,
        content: pageContent
      })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
    
    sendResponse({status: 'OK'});
  }
});