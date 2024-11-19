document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get(['apiKey'], (settings) => {
    if (settings.apiKey) {
      document.getElementById('apiKey').value = settings.apiKey;
    }
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    
    chrome.storage.sync.set({ apiKey }, () => {
      showStatus('Settings saved successfully!', 'success');
    });
  });
});

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';

  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
} 