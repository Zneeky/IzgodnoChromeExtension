chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'openTab' && message.url) {
    chrome.tabs.create({ url: message.url, active: false });
  }
});