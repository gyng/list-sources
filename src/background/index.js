let active = false;

const requestCallback = type => x => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(x.tabId, { type, info: x }, () => {});
  });
};

const mediaCallback = requestCallback("video");

chrome.browserAction.onClicked.addListener(() => {
  if (active) {
    chrome.tabs.executeScript(null, { file: "src/content/disable.js" });
    chrome.webRequest.onBeforeRequest.removeListener(mediaCallback);

    active = false;
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
    chrome.browserAction.setIcon({
      path: "icons/ic_photo_library_black_48dp_2x_active.png"
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only load if url changed (fresh load)
  if (changeInfo.url && changeInfo.status === "complete" && active === true) {
    chrome.tabs.executeScript(null, { file: "src/content/index.js" });
  }
});
