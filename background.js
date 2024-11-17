chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'backgroundAction') {
    // Handle background actions here
    sendResponse({ success: true });
  }
});