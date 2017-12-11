let active = false;

chrome.browserAction.onClicked.addListener(() => {
  if (active) {
    chrome.tabs.executeScript(null, { file: "src/content/disable.js" });
    active = false;
  } else {
    chrome.tabs.executeScript(null, { file: "src/content/index.js" });
    active = true;
  }
});
