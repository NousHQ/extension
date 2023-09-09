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
  const banner = document.createElement('div');
  banner.style.position = 'fixed';
  banner.style.top = '0';
  banner.style.right = '0';
  banner.style.backgroundColor = data.status === 'ok' ? '#4CAF50' : 'red';
  banner.style.color = 'white';
  banner.style.padding = '16px';
  banner.style.zIndex = '9999';
  banner.textContent = data.status === 'ok' ? 'Saved to Nous' : 'Error!';
  document.body.appendChild(banner);
  setTimeout(() => {
    banner.remove();
  }, 3000);
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    try {
      const data = await savePage();
      sendResponse(data);
    } catch (error) {
      console.error('Error in background script:', error);
      sendResponse({ status: 'error', message: error.message });
    }
    return true;
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

