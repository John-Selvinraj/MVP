// Initialize variables
let enhancementService;
let lastRange = null;
let showTooltipsGlobal = true; // Default state

// EnhancementService class
class EnhancementService {
  constructor() {
    this.englishVariant = 'american';
    this.tone = 'professional';
    this.model = 'gpt-3.5-turbo';
    this.outputCount = '1';
    
    // Load the preferences
    chrome.storage.sync.get(['englishVariant', 'tone', 'model', 'outputCount'], (settings) => {
      this.englishVariant = settings.englishVariant || 'american';
      this.tone = settings.tone || 'professional';
      this.model = settings.model || 'gpt-3.5-turbo';
      this.outputCount = settings.outputCount || '1';
    });
  }

  async getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apiKey'], (result) => {
        resolve(result.apiKey || '');
      });
    });
  }

  async enhance(text, objective) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('API key is not set');
    }

    const variantText = this.englishVariant === 'british' ? 'British English' : 'American English';
    const toneText = this.tone === 'casual' ? 'casual and friendly' : 'professional and formal';
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{
            role: 'system',
            content: `You are a professional business communications expert that writes in ${variantText} with a ${toneText} tone. Always use ${variantText} spelling and grammar conventions while maintaining the specified tone.`
          }, {
            role: 'user',
            content: this.buildPrompt(text, objective)
          }],
          temperature: 0.7,
          n: parseInt(this.outputCount) // Convert string to number
        })
      });
  
      const data = await response.json();
      if (!data.choices?.length) {
        throw new Error('Invalid API response');
      }
      
      // Return array of processed outputs
      return data.choices.map(choice => {
        let content = choice.message.content;
        content = content.replace(/```(?:\w+)?\n?([\s\S]*?)\n?```/g, '$1');
        // Removed the line that deletes apostrophes and quotes
        // content = content.replace(/["']/g, '');
        content = content
          .split('\n')
          .map(line => line.trim())
          .join('\n')
          .replace(/\n{2,}/g, '\n\n');
        return content.trim();
      });
    } catch (error) {
      console.error('API Error:', error);
      throw new Error(`Enhancement failed: ${error.message}`);
    }
  }

  buildPrompt(text, objective) {
    const variantText = this.englishVariant === 'british' ? 'British English' : 'American English';
    const toneText = this.tone === 'casual' ? 'casual and friendly' : 'professional and formal';
    
    const objectiveGuide = {
      clarity: `Enhance clarity by removing ambiguity and simplifying complex sentences, while using ${variantText} spelling and maintaining a ${toneText} tone`,
      grammar: `Ensure grammatical accuracy and proper usage to maintain credibility, following ${variantText} conventions and a ${toneText} tone`,
      concise: `Convey the same meaning using as few words as possible, keeping the message focused and impactful, while using ${variantText} spelling and a ${toneText} tone`
    };

    // Base requirements that apply to all objectives
    const baseRequirements = [
      `${objectiveGuide[objective]}`,
      'Keep any technical terms intact',
      `Ensure all spelling and grammar follows ${variantText} conventions`,
      `Maintain a ${toneText} tone throughout`,
      'Return ONLY the revised text without any additional explanations or formatting'
    ];

    // Add objective-specific requirements
    const specificRequirements = objective === 'concise' 
      ? [
          'Feel free to remove or rephrase content to achieve maximum brevity',
          'Maintain core meaning but eliminate any non-essential information'
        ]
      : [
          'Maintain the original meaning and punctuation (including apostrophes)'
        ];

    return `
Please revise the following message:

"${text}"

Requirements:
${[...baseRequirements, ...specificRequirements].map(req => `- ${req}`).join('\n')}
`;
  }

  cleanText(text) {
    return text
      .replace(/[^\w\s'’]/g, '') // Allow both straight and curly apostrophes
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Add this function to update icon sizes
function updateIconSizes(size) {
  const icons = document.querySelector('.message-enhancer-icons');
  if (icons) {
    icons.style.setProperty('--icon-size', `${size}px`);
    // Adjust padding based on icon size
    const padding = size <= 26 ? 5 : size >= 30 ? 7 : 6;
    icons.style.setProperty('--icon-padding', `${padding}px`);
  }
}

// Create enhancement icons container
const iconsContainer = document.createElement('div');
iconsContainer.className = 'message-enhancer-icons hidden';
chrome.storage.sync.get(['iconSize'], (settings) => {
  const size = parseInt(settings.iconSize || '28');
  iconsContainer.style.setProperty('--icon-size', `${size}px`);
  const padding = size <= 26 ? 5 : size >= 30 ? 7 : 6;
  iconsContainer.style.setProperty('--icon-padding', `${padding}px`);
});
iconsContainer.innerHTML = `
  <button class="enhance-icon" data-objective="clarity" data-tooltip="Enhance Clarity">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  </button>
  <button class="enhance-icon" data-objective="grammar" data-tooltip="Fix Grammar">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  </button>
  <button class="enhance-icon" data-objective="concise" data-tooltip="Make Concise">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
      <path d="M4 6h16"/>
      <path d="M4 12h10"/>
      <path d="M4 18h4"/>
    </svg>
  </button>
`;

document.body.appendChild(iconsContainer);

// Add this function to handle tooltip visibility
function updateTooltipVisibility() {
  const iconsContainer = document.querySelector('.message-enhancer-icons');
  if (iconsContainer) {
    iconsContainer.setAttribute('data-show-tooltips', showTooltipsGlobal.toString());
  }
}

// Update the initialization code
function initializeEnhancementService() {
  chrome.storage.sync.get(
    ['apiKey', 'englishVariant', 'tone', 'model', 'iconSize', 'outputCount', 'showTooltips'], 
    (settings) => {
      if (settings.apiKey) {
        enhancementService = new EnhancementService(settings.apiKey);
      } else {
        console.error('OpenAI API key is not set in the extension settings.');
      }
      
      if (settings.iconSize) {
        updateIconSizes(parseInt(settings.iconSize));
      }

      // Update global tooltip state
      showTooltipsGlobal = settings.showTooltips ?? true;
      updateTooltipVisibility();
    }
  );
}

// Update the storage change listener
chrome.storage.onChanged.addListener((changes) => {
  if (changes.apiKey || changes.englishVariant || changes.tone || 
      changes.model || changes.outputCount) {
    initializeEnhancementService();
  }
  if (changes.iconSize) {
    updateIconSizes(parseInt(changes.iconSize.newValue));
  }
  if (changes.showTooltips) {
    showTooltipsGlobal = changes.showTooltips.newValue;
    updateTooltipVisibility();
  }
});

// Initialize on load
initializeEnhancementService();

// Handle selection changes to show enhancement icons
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // Check if selection is within a Slack message input area
  const isInMessageInput = selection.anchorNode?.parentElement?.closest('.ql-editor') ||
                          selection.anchorNode?.parentElement?.closest('[data-qa="message_input"]') ||
                          selection.anchorNode?.parentElement?.closest('[contenteditable="true"]');

  if (selectedText && selection.rangeCount > 0 && isInMessageInput) {
    lastRange = selection.getRangeAt(0);
    const rect = lastRange.getBoundingClientRect();

    // Position the icons near the selection
    iconsContainer.style.top = `${window.scrollY + rect.bottom + 10}px`;
    iconsContainer.style.left = `${window.scrollX + rect.left}px`;
    iconsContainer.classList.remove('hidden');
  } else {
    iconsContainer.classList.add('hidden');
  }
});

// Hide icons when clicking elsewhere
document.addEventListener('mousedown', (e) => {
  if (!iconsContainer.contains(e.target)) {
    iconsContainer.classList.add('hidden');
  }
});

// Handle icon clicks
iconsContainer.querySelectorAll('.enhance-icon').forEach(icon => {
  icon.addEventListener('click', async () => {
    const objective = icon.dataset.objective;
    await handleEnhancement(objective);
  });
});

async function handleEnhancement(objective) {
  if (!lastRange) return;
  if (!enhancementService) {
    enhancementService = new EnhancementService();
  }

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (!selectedText) return;

  try {
    const apiKey = await enhancementService.getApiKey();
    if (!apiKey) {
      showError('Please set your OpenAI API key in the extension settings');
      return;
    }

    const enhancedOutputs = await enhancementService.enhance(selectedText, objective);
    
    const selectedOutput = await showPreview(selectedText, enhancedOutputs);
    if (selectedOutput) {
      await replaceSelectedText(selectedOutput);
    }
  } catch (error) {
    console.error('Enhancement error:', error);
    showError('Failed to enhance text: ' + error.message);
  } finally {
    iconsContainer.classList.add('hidden');
  }
}
async function replaceSelectedText(newText) {
  if (!lastRange) return;

  const messageInput = lastRange.startContainer.parentElement.closest('.ql-editor') || 
                      lastRange.startContainer.parentElement.closest('[data-qa="message_input"]') ||
                      lastRange.startContainer.parentElement.closest('[contenteditable="true"]');

  if (!messageInput) return;

  const cleanedText = newText.trim().replace(/^\n+|\n+$/g, '');
  
  // Get the text content before the selection
  const beforeRange = document.createRange();
  beforeRange.setStart(messageInput, 0);
  beforeRange.setEnd(lastRange.startContainer, lastRange.startOffset);
  const beforeText = beforeRange.toString();

  // Get the text content after the selection
  const afterRange = document.createRange();
  afterRange.setStart(lastRange.endContainer, lastRange.endOffset);
  afterRange.setEnd(messageInput, messageInput.childNodes.length);
  const afterText = afterRange.toString();

  // Combine the text parts
  messageInput.textContent = beforeText + cleanedText + afterText;

  // Update cursor position
  const range = document.createRange();
  const textNode = messageInput.firstChild || messageInput;
  const newPosition = beforeText.length + cleanedText.length;
  range.setStart(textNode, newPosition);
  range.setEnd(textNode, newPosition);
  
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  lastRange = null;
}

function showPreview(original, enhancedOutputs) {
  return new Promise((resolve) => {
    const preview = document.createElement('div');
    preview.className = 'message-enhancer-preview';
    
    let currentIndex = 0;
    const totalOutputs = enhancedOutputs.length;
    
    function updatePreviewContent() {
      const previewContent = document.querySelector('.preview-content');
      const outputText = enhancedOutputs[currentIndex];
      const navigationHTML = totalOutputs > 1 ? `
        <div class="preview-navigation">
          <button class="nav-btn prev" ${currentIndex === 0 ? 'disabled' : ''}>←</button>
          <span class="output-counter">${currentIndex + 1}/${totalOutputs}</span>
          <button class="nav-btn next" ${currentIndex === totalOutputs - 1 ? 'disabled' : ''}>→</button>
        </div>
      ` : '';

      previewContent.innerHTML = `
        <h3>Message Enhancement Preview</h3>
        ${navigationHTML}
        <div class="preview-text">${outputText.replace(/\n/g, '<br>')}</div>
        <div class="preview-actions">
          <button class="cancel-btn">Cancel</button>
          <button class="apply-btn">Apply Changes</button>
        </div>
      `;

      // Reattach event listeners
      if (totalOutputs > 1) {
        previewContent.querySelector('.prev')?.addEventListener('click', () => {
          if (currentIndex > 0) {
            currentIndex--;
            updatePreviewContent();
          }
        });

        previewContent.querySelector('.next')?.addEventListener('click', () => {
          if (currentIndex < totalOutputs - 1) {
            currentIndex++;
            updatePreviewContent();
          }
        });
      }

      previewContent.querySelector('.cancel-btn').onclick = () => {
        preview.remove();
        resolve(false);
      };

      previewContent.querySelector('.apply-btn').onclick = () => {
        preview.remove();
        resolve(enhancedOutputs[currentIndex]);
      };
    }

    preview.innerHTML = '<div class="preview-content"></div>';
    document.body.appendChild(preview);
    updatePreviewContent();

    // Close on clicking outside
    preview.addEventListener('click', (e) => {
      if (e.target === preview) {
        preview.remove();
        resolve(false);
      }
    });

    // Close on Escape key
    function escapeHandler(e) {
      if (e.key === 'Escape') {
        preview.remove();
        resolve(false);
        document.removeEventListener('keydown', escapeHandler);
      }
    }
    document.addEventListener('keydown', escapeHandler);
  });
}

function showError(message) {
  const error = document.createElement('div');
  error.className = 'message-enhancer-error';
  error.textContent = message;
  document.body.appendChild(error);
  setTimeout(() => error.remove(), 3000);
}

// When creating enhancement icons, add a class for tooltips
function createEnhancementIcon(objective, tooltip) {
  const icon = document.createElement('div');
  icon.className = 'enhancement-icon';
  
  const tooltipElement = document.createElement('span');
  tooltipElement.className = 'enhancement-tooltip';
  tooltipElement.textContent = tooltip;
  
  icon.appendChild(tooltipElement);
  icon.addEventListener('click', () => handleEnhancement(objective));
  
  return icon;
}

// Function to validate API key
const isValidApiKey = (apiKey) => {
  return apiKey && typeof apiKey === 'string' && apiKey.trim().startsWith('sk-');
};

// Function to get settings including API key
async function getSettings() {
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

    return { ...syncSettings, ...localSettings };
  } catch (error) {
    console.error('Error getting settings:', error);
    return null;
  }
}

// When making API calls
async function makeApiCall() {
  const settings = await getSettings();
  const apiKey = settings?.apiKey?.trim() || '';
  
  if (!isValidApiKey(apiKey)) {
    throw new Error('Please set a valid OpenAI API key in the extension settings.');
  }

  try {
    // Make your API call using the apiKey
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // ... your request body
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key in the extension settings.');
      }
      throw new Error('API request failed. Please try again.');
    }

    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

// Add listener for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'settingsUpdated') {
    // Clear any cached API key or settings
    cachedSettings = null;
  }
});
