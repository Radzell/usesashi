chrome.runtime.onInstalled.addListener((message: any) => {
  console.log('Extension Installed')
  if (message.action === 'get-config') {
    
    // Perform the necessary actions, such as waking up or handling headers
    //sendResponse({ headers: 'Example headers' });
  }
});