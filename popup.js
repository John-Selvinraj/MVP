document.addEventListener('DOMContentLoaded', () => {
  // Load saved API key
  chrome.storage.sync.get(['apiKey'], (settings) => {
    if (settings.apiKey) {
      document.getElementById('apiKey').value = settings.apiKey;
    }
  });

  // Save API key
  document.getElementById('saveApiKey').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.sync.set({ apiKey }, () => {
      updateStatus('API key saved successfully!');
    });
  });
});

function updateStatus(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}