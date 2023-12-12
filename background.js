// gets the tab which is open
async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log(tabs[0]);
  return tabs[0];
}

// gets the page content from a given tab
// injects and executes content_script.js programmatically
// this allows us to get page content w/o reload
async function getPageContent(tab) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      { target: { tabId: tab.id }, files: ["content_script.js"] },
      () => {
        chrome.tabs.sendMessage(
          tab.id,
          { action: "getPageContent" },
          (response) => {
            if (chrome.runtime.lastError) {
              if (
                chrome.runtime.lastError.message ===
                "The message port closed before a response was received"
              ) {
                reject("Page needs refresh");
              } else {
                reject(chrome.runtime.lastError.message);
              }
            } else if (response) {
              resolve({
                pageInfo: {
                  readable: response.readable,
                  rawText: response.content,
                  readabilityContent: response.readability,
                },
                tab: tab,
              });
            } else {
              reject("No response received");
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
    chrome.storage.local.get(["access_token"], function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.access_token);
      }
    });
  });
}

// listens for messages from the app to get JWT
chrome.runtime.onMessageExternal.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request && request.action === "getJWT") {
    const token = request.access_token;
    chrome.storage.local.set({ access_token: token }).then(() => {
      console.log("set access_token", token);
    });
    sendResponse({ status: "recieved" });
  } else if (request && request.action === "getBookmarks") {
    chrome.bookmarks.getTree((bookmarks) => {
      sendResponse({ bookmarks: bookmarks });
    });
  }
});

// listens for messages from popup.js to get page content
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    const tab = await getCurrentTab();
    savePage(tab).then((data) => {
      chrome.runtime.sendMessage({ action: "response", data: data });
    });
  }
});

// listens for keyboard shortcut to save page
chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Command "${command}" triggered`);
  const tab = await getCurrentTab();
  console.log(tab);
  const data = await savePage(tab);
  console.log(data);
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: showBanner,
    args: [data],
  });
});

// on install, create the context menu and open login page
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-nous",
    title: "Save to Nous",
    contexts: ["page"],
  });
  chrome.tabs.create({ url: "https://app.nous.fyi/?ext" });
  // chrome.tabs.create({ url: 'http://localhost:3000/login' });
});

// listens for context menu click to save page
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-nous") {
    const tab = await getCurrentTab();
    const data = await savePage(tab);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showBanner,
      args: [data],
    });
  }
});

// Listen for new bookmarks being added
chrome.bookmarks.onCreated.addListener(async (id, bookmark) => {
  console.log("New bookmark added:", bookmark);
  const tab = await getCurrentTab();
  const data = await savePage(tab);
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: showBanner,
    args: [data],
  });
  console.log("Page saved:", data);
});

// calls the save endpoint with the page data
async function savePage(tab) {
  try {
    // const tab = await getCurrentTab();
    const { pageInfo } = await getPageContent(tab);
    console.log(pageInfo);
    const jwt = await getJWT();
    const apiResponse = await fetch(
      'https://api.nous.fyi/api/save',
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + jwt,
        },
        body: JSON.stringify({
          pageData: {
            favIconUrl: tab.favIconUrl,
            url: tab.url,
            title: tab.title,
            content: pageInfo,
          },
        }),
      }
    );

    if (apiResponse.status === 403) {
      // Wait for 4 seconds
      setTimeout(() => {
        // Open the app with a specific query parameter
        chrome.tabs.create(
          { url: "https://app.nous.fyi/?ext" },
        );
      }, 4000);
      return { status: "token_expired", message: "Token expired" };
    }

    const data = await apiResponse.json();
    console.log(data);
    return data;
  } catch (error) {
    console.log(error);
    return { status: "error", message: error };
  }
}

// shows a banner on the page
function showBanner(data) {
  const notyf = new Notyf({
    duration: 3000,
    position: {
      x: "right",
      y: "top",
    },
    ripple: true,
    types: [
      {
        type: "success",
        background: "#065B08",
      },
      {
        type: "warning",
        background: "#FF801F",
      },
    ],
  });
  console.log(data.status);
  if (data.status === "ok") {
    notyf.success("saved to nous!");
  } else if (data.status === "limit_reached") {
    notyf.open({ type: "warning", message: "Limit Reached!" });
  } else if (data.status === "token_expired") {
    notyf.error("Token expired! Opening app...");
  } else {
    notyf.error("Refresh page!");
  }
}
