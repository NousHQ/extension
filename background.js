// gets the tab which is open
async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

// gets the page content from a given tab
// injects and executes content_script.js programmatically 
// this allows us to get page content w/o reload
async function getPageContent(tab) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      { target: { tabId: tab.id }, files: ['content_script.js'] },
      () => {
        chrome.tabs.sendMessage(
          tab.id,
          { action: 'getPageContent' },
          (response) => {
            if (response) {
              resolve({ pageInfo: response.content, tab: tab });
            } else {
              reject('No response received');
            }
          }
        );
      }
    );
  });
}


// this function gets the JWT from local storage
async function getJWT() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['access_token'], function(result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.access_token);
      }
    });
  });
}


// listens for messages from the app to get JWT
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request && request.action) {
      const token = request.access_token;
      chrome.storage.local.set({ access_token: token }).then(() => {
        console.log("set access_token", token);
      });
      sendResponse({ status: 'recieved' })
    }
  }
);


// listens for messages from popup.js to get page content
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    savePage().then(data => {
      sendResponse(data);
    }).catch(error => {
      console.error('Error in background script:', error);
      sendResponse({ status: 'error', message: error.message });
    });
    return true; // keeps the message channel open until sendResponse is called
  }
});


// listens for keyboard shortcut to save page
chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Command "${command}" triggered`);
  const tab = await getCurrentTab();
  const data = await savePage();
  console.log(data)
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: showBanner,
    args: [data],
  });
});


// on install, create the context menu and open login page
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-nous',
    title: 'Save to Nous',
    contexts: ['page'],
  });
  chrome.tabs.create({ url: 'https://app.nous.fyi/login' });
})


// listens for context menu click to save page
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-nous') {
    const data = await savePage();
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showBanner,
      args: [data],
    });
  }
});


// calls the save endpoint with the page data
async function savePage() {
  try {
    const tab = await getCurrentTab();
    const { pageInfo } = await getPageContent(tab);
    const jwt = await getJWT();
    const apiResponse = await fetch(
      'https://api.nous.fyi/api/save',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + jwt,
        },
        body: JSON.stringify({
          pageData: {
            url: tab.url,
            title: tab.title,
            content: pageInfo,
          },
        }),
      }
    );
    const data = await apiResponse.json();
    console.log(data)
    return data;
  } catch (error) {
    console.error('Error in background script:', error);
    return { status: 'error', message: error.message };
  }
}


// shows a banner on the page
function showBanner(data) {
  const notyf = new Notyf({
    duration: 3000,
    position: {
      x: 'right',
      y: 'top',
    },
    ripple: true,
    types: [
      {
        type: 'success',
        background: '#065B08',
      },
    ],
  });
  
  if (data.status === 'ok') {
    notyf.success('saved to nous!');
  }
  else {
    notyf.error('please login and retry!');
  }
}
