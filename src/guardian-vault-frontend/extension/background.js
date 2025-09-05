// Minimal MV3 background to prepare messaging between popup and web app.
chrome.runtime.onInstalled.addListener(() => {
  console.log('Guardian Vault extension installed');
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.ping) sendResponse({ pong: true });
});

