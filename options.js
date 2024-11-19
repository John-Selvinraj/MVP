document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get(['apiKey', 'englishVariant', 'tone', 'model', 'iconSize', 'outputCount'], (settings) => {
    if (settings.apiKey) {
      document.getElementById('apiKey').value = settings.apiKey;
    }
    
    // Set the English variant radio button
    const variant = settings.englishVariant || 'american';
    document.querySelector(`input[name="englishVariant"][value="${variant}"]`).checked = true;
    
    // Set the tone radio button
    const tone = settings.tone || 'professional';
    document.querySelector(`input[name="tone"][value="${tone}"]`).checked = true;

    // Set the model radio button
    const model = settings.model || 'gpt-3.5-turbo';
    document.querySelector(`input[name="model"][value="${model}"]`).checked = true;

    // Set the icon size radio button
    const iconSize = settings.iconSize || '28';
    document.querySelector(`input[name="iconSize"][value="${iconSize}"]`).checked = true;

    // Set the output count radio button
    const outputCount = settings.outputCount || '1';
    document.querySelector(`input[name="outputCount"][value="${outputCount}"]`).checked = true;
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    const englishVariant = document.querySelector('input[name="englishVariant"]:checked').value;
    const tone = document.querySelector('input[name="tone"]:checked').value;
    const model = document.querySelector('input[name="model"]:checked').value;
    const iconSize = document.querySelector('input[name="iconSize"]:checked').value;
    const outputCount = document.querySelector('input[name="outputCount"]:checked').value;
    
    chrome.storage.sync.set({ 
      apiKey, 
      englishVariant,
      tone,
      model,
      iconSize,
      outputCount
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