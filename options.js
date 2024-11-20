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

  // Function to clear all storage
  const clearStorage = async () => {
    try {
      await Promise.all([
        chrome.storage.local.clear(),
        chrome.storage.sync.clear()
      ]);
      console.log('Storage cleared successfully');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  const verifyApiKey = async (apiKey) => {
    if (!apiKey) return false;
    if (!apiKey.startsWith('sk-')) return false;
    if (apiKey.length < 20) return false;

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        console.error('API key verification failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('API key verification error:', error);
      return false;
    }
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

      // Handle API key
      const apiKeyInput = document.getElementById('apiKey');
      const apiKey = apiKeyInput?.value?.trim() || '';

      if (apiKey) {
        const isValid = await verifyApiKey(apiKey);
        if (!isValid) {
          showError('Invalid API key. Please check your OpenAI API key.');
          return;
        }
      }

      console.log('Saving API key:', apiKey ? 'Key present' : 'No key'); // Debug log

      // Always clear existing API key first
      await chrome.storage.local.remove('apiKey');

      // Only save new API key if it's not empty
      if (apiKey) {
        await chrome.storage.local.set({ apiKey });
        
        // Verify the key was saved
        const savedKey = await chrome.storage.local.get(['apiKey']);
        console.log('Verified saved key:', savedKey.apiKey ? 'Key exists' : 'No key'); // Debug log
      }

      // Save other settings
      await chrome.storage.sync.set(syncSettings);

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
      showError('Failed to save settings: ' + error.message);
    }
  };

  // Add change event listeners to all inputs
  const addChangeListeners = () => {
    // For radio buttons
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', saveSettings);
    });

    // For API key input
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput) {
      // Save on input (debounced)
      let debounceTimeout;
      apiKeyInput.addEventListener('input', () => {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        debounceTimeout = setTimeout(saveSettings, 500);
      });

      // Save immediately on blur
      apiKeyInput.addEventListener('blur', saveSettings);

      // Clear button functionality
      apiKeyInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (!apiKeyInput.value) {
            console.log('Manual clear triggered'); // Debug log
            await chrome.storage.local.remove('apiKey');
            await saveSettings();
          }
        }
      });
    }
  };

  // Add this function to load saved settings
  const loadSavedSettings = async () => {
    try {
      const { apiKey } = await chrome.storage.local.get(['apiKey']);
      console.log('Loading saved API key:', apiKey ? 'Key exists' : 'No key'); // Debug log
      
      const apiKeyInput = document.getElementById('apiKey');
      if (apiKeyInput && apiKey) {
        apiKeyInput.value = apiKey;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Call loadSavedSettings when the page loads
  loadSavedSettings();

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

    console.log('Initial load - API Key:', localSettings.apiKey ? 'exists' : 'empty'); // Debug log

    // Set API key
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput) {
      apiKeyInput.value = localSettings.apiKey || '';
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