let active = false;
const activeTabs = {};

const setCurrentTabActiveStatus = status => {
  chrome.tabs.query(
    {
      active: true,
      windowType: "normal",
      currentWindow: true
    },
    tabs => {
      const tab = tabs[0];
      if (!activeTabs[tab.windowId]) {
        activeTabs[tab.windowId] = {};
      }
      activeTabs[tab.windowId][tab.id] = status;
    }
  );
};

const setTabActiveStatus = (status, windowId, tabId) => {
  if (!activeTabs[windowId]) {
    activeTabs[windowId] = {};
  }
  activeTabs[windowId][tabId] = status;
};

const requestCallback = type => request => {
  if (active) {
    chrome.tabs.sendMessage(request.tabId, { type, info: request });
  }
};

const mediaCallback = requestCallback("video");

const toggleActive = () => {
  if (active) {
    chrome.tabs.executeScript(null, { file: "src/content/disable.js" });
    chrome.webRequest.onBeforeRequest.removeListener(mediaCallback);

    active = false;
    setCurrentTabActiveStatus(false);
    chrome.browserAction.setIcon({
      path: "icons/ic_photo_library_black_48dp_2x.png"
    });
  } else {
    chrome.tabs.executeScript(null, { file: "src/content/index.js" });

    chrome.webRequest.onBeforeRequest.addListener(mediaCallback, {
      urls: ["<all_urls>"],
      types: ["media"]
    });

    active = true;
    setCurrentTabActiveStatus(true);
    chrome.browserAction.setIcon({
      path: "icons/ic_photo_library_black_48dp_2x_active.png"
    });
  }
};

chrome.browserAction.onClicked.addListener(toggleActive);
chrome.commands.onCommand.addListener(command => {
  if (command === "toggle-active") {
    toggleActive();
  }
});

const toggleInject = (windowId, tabId) => {
  if (!activeTabs[windowId]) {
    activeTabs[windowId] = {};
    // New window, let tabs.onUpdated handle this on load
    return;
  }

  // Only inject if not loaded in tab
  if (active && !activeTabs[windowId][tabId]) {
    chrome.tabs.executeScript(tabId, { file: "src/content/index.js" });
    setTabActiveStatus(true, windowId, tabId);
  } else if (!active && activeTabs[windowId][tabId]) {
    chrome.tabs.executeScript(tabId, { file: "src/content/disable.js" });
    setTabActiveStatus(false, windowId, tabId);
  }
};

const injectUpdated = (tabId, change, win) => {
  const windowId = win.windowId;

  // Page navigated, need to reset injected status
  if (change.status === "loading" && change.url) {
    if (activeTabs[windowId] && activeTabs[windowId][tabId]) {
      activeTabs[windowId][tabId] = false;
    }
  }

  // Only inject if page finished loading
  if (change.status === "complete") {
    toggleInject(windowId, tabId);
  }
};

const injectActivated = tab => {
  const windowId = tab.windowId;
  const tabId = tab.tabId;
  toggleInject(windowId, tabId);
};

chrome.tabs.onUpdated.addListener(injectUpdated);
chrome.tabs.onActivated.addListener(injectActivated);

chrome.runtime.onMessage.addListener(request => {
  if (request.type === "download") {
    chrome.downloads.download({
      url: request.src
    });
  }
});
