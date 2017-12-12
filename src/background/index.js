let active = false;
const activeTabs = {};

const setTabActiveStatus = (status, id) => {
  if (id) {
    activeTabs[id] = status;
  } else {
    chrome.tabs.query(
      {
        active: true,
        windowType: "normal",
        currentWindow: true
      },
      tabs => {
        activeTabs[tabs[0].id] = status;
      }
    );
  }
};

const requestCallback = type => request => {
  chrome.tabs.sendMessage(request.tabId, { type, info: request });
};

const mediaCallback = requestCallback("video");

chrome.browserAction.onClicked.addListener(() => {
  if (active) {
    chrome.tabs.executeScript(null, { file: "src/content/disable.js" });
    chrome.webRequest.onBeforeRequest.removeListener(mediaCallback);

    active = false;
    setTabActiveStatus(false);
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
    setTabActiveStatus(true);
    chrome.browserAction.setIcon({
      path: "icons/ic_photo_library_black_48dp_2x_active.png"
    });
  }
});

const inject = tab => {
  const tabId = tab.tabId || tab; // tab object or tab ID
  // Only inject if not loaded in tab
  if (!activeTabs[tabId] && active === true) {
    chrome.tabs.executeScript(null, { file: "src/content/index.js" });
    setTabActiveStatus(true, tabId);
  } else if (activeTabs[tabId] && !active) {
    chrome.tabs.executeScript(null, { file: "src/content/disable.js" });
    setTabActiveStatus(false, tabId);
  }
};

chrome.tabs.onUpdated.addListener(inject);
chrome.tabs.onActivated.addListener(inject);
