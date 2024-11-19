document.addEventListener('DOMContentLoaded', () => {
  // Load initial states
  chrome.storage.sync.get(['englishVariant', 'tone'], (result) => {
    // Set language variant buttons
    const variant = result.englishVariant || 'american';
    document.getElementById('american').classList.toggle('active', variant === 'american');
    document.getElementById('british').classList.toggle('active', variant === 'british');

    // Set tone buttons
    const tone = result.tone || 'professional';
    document.getElementById('professional').classList.toggle('active', tone === 'professional');
    document.getElementById('casual').classList.toggle('active', tone === 'casual');
  });

  // Language variant buttons
  document.getElementById('american').addEventListener('click', () => {
    updateButtonGroup('american', 'british', 'englishVariant', 'american');
  });

  document.getElementById('british').addEventListener('click', () => {
    updateButtonGroup('british', 'american', 'englishVariant', 'british');
  });

  // Tone buttons
  document.getElementById('professional').addEventListener('click', () => {
    updateButtonGroup('professional', 'casual', 'tone', 'professional');
  });

  document.getElementById('casual').addEventListener('click', () => {
    updateButtonGroup('casual', 'professional', 'tone', 'casual');
  });

  // Settings button
  document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});

function updateButtonGroup(activeId, inactiveId, storageKey, storageValue) {
  document.getElementById(activeId).classList.add('active');
  document.getElementById(inactiveId).classList.remove('active');
  chrome.storage.sync.set({ [storageKey]: storageValue });
}