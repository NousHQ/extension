async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

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


async function savePage() {
  try {
    const tab = await getCurrentTab();
    const { pageInfo } = await getPageContent(tab);
    const apiResponse = await fetch(
      'https://stunning-cheerful-adder.ngrok-free.app/api/save',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (await getJWT()),
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
    return data;
  } catch (error) {
    console.error('Error in background script:', error);
    return { status: 'error', message: error.message };
  }
}


async function getJWT() {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({ url: 'https://app.nous.fyi', name: 'jwt' }, (cookie) => {
      if (cookie) {
        resolve(cookie.value);
      } else {
        reject('No JWT cookie found');
      }
    });
  });
}


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


chrome.contextMenus.create({
  id: 'save-to-nous',
  title: 'Save to Nous',
  contexts: ['page'],
});

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