document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});