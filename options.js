document.addEventListener('DOMContentLoaded', async () => {
  const saveMessage = document.getElementById('saveMessage');
  let saveTimeout;

  // Add the missing checkExtensionContext function
  const checkExtensionContext = () => {
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated. Please refresh the page.');
    }
  };

  // Function to show save message
  const showSaveMessage = () => {
    saveMessage.classList.add('visible');
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      saveMessage.classList.remove('visible');
    }, 2000);
  };

  // Function to save settings
  const saveSettings = async () => {
    try {
      checkExtensionContext();

      const syncSettings = {
        model: document.querySelector('input[name="model"]:checked')?.value || 'gpt-3.5-turbo',
        englishVariant: document.querySelector('input[name="englishVariant"]:checked')?.value || 'american',
        tone: document.querySelector('input[name="tone"]:checked')?.value || 'casual',
        showTooltips: document.querySelector('input[name="showTooltips"]:checked')?.value === 'true',
        outputCount: document.querySelector('input[name="outputCount"]:checked')?.value || '3',
        iconSize: document.querySelector('input[name="iconSize"]:checked')?.value || 'medium'
      };

      // Get API key and trim whitespace
      const apiKey = (document.getElementById('apiKey')?.value || '').trim();

      // Save settings
      await Promise.all([
        chrome.storage.local.set({ apiKey }),
        chrome.storage.sync.set(syncSettings)
      ]);

      // Show save message
      showSaveMessage();

      // Notify content scripts of the change
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'settingsUpdated',
          settings: { ...syncSettings, apiKey }
        }).catch(() => {
          // Ignore errors for inactive tabs
        });
      });

    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Add change event listeners to all inputs
  const addChangeListeners = () => {
    // For radio buttons
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', saveSettings);
    });

    // For API key input (debounced)
    const apiKeyInput = document.getElementById('apiKey');
    let debounceTimeout;
    apiKeyInput.addEventListener('input', () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      debounceTimeout = setTimeout(saveSettings, 500);
    });

    // Also save on blur for API key
    apiKeyInput.addEventListener('blur', saveSettings);
  };

  // Initial load
  try {
    const [syncSettings, localSettings] = await Promise.all([
      chrome.storage.sync.get({
        model: 'gpt-3.5-turbo',
        englishVariant: 'american',
        tone: 'casual',
        showTooltips: true,
        outputCount: '3',
        iconSize: 'medium'
      }),
      chrome.storage.local.get({
        apiKey: ''
      })
    ]);

    // Set API key
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput) {
      apiKeyInput.value = localSettings.apiKey;
    }

    // Helper function to safely set radio button
    const setRadioButton = (name, value) => {
      const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (radio) {
        radio.checked = true;
      }
    };

    // Set radio buttons
    setRadioButton('model', syncSettings.model);
    setRadioButton('englishVariant', syncSettings.englishVariant);
    setRadioButton('tone', syncSettings.tone);
    setRadioButton('showTooltips', syncSettings.showTooltips.toString());
    setRadioButton('outputCount', syncSettings.outputCount);
    setRadioButton('iconSize', syncSettings.iconSize);

    // Add change listeners after setting initial values
    addChangeListeners();

  } catch (error) {
    console.error('Error loading settings:', error);
  }
}); 