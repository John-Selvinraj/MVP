document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get(['apiKey', 'englishVariant', 'tone'], (settings) => {
    if (settings.apiKey) {
      document.getElementById('apiKey').value = settings.apiKey;
    }
    
    // Set the English variant radio button
    const variant = settings.englishVariant || 'american';
    document.querySelector(`input[name="englishVariant"][value="${variant}"]`).checked = true;
    
    // Set the tone radio button
    const tone = settings.tone || 'professional';
    document.querySelector(`input[name="tone"][value="${tone}"]`).checked = true;
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    const englishVariant = document.querySelector('input[name="englishVariant"]:checked').value;
    const tone = document.querySelector('input[name="tone"]:checked').value;
    
    chrome.storage.sync.set({ 
      apiKey, 
      englishVariant,
      tone 
    }, () => {
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