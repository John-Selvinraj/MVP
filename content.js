// Initialize variables
let enhancementService;
let lastRange = null;

// EnhancementService class
class EnhancementService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async enhance(text, objective) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: 'You are a professional writing assistant.'
          }, {
            role: 'user',
            content: this.buildPrompt(text, objective)
          }],
          temperature: 0.7
        })
      });

      const data = await response.json();
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response');
      }
      
      let content = data.choices[0].message.content;

      // Post-processing to remove unwanted quotation marks and normalize whitespace
      content = content.replace(/```(?:\w+)?\n?([\s\S]*?)\n?```/g, '$1'); // Remove code blocks if present
      content = content.replace(/["']/g, ''); // Remove quotation marks
      content = content
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .replace(/\n{2,}/g, '\n\n'); // Normalize whitespace and preserve paragraphs

      return content.trim();
    } catch (error) {
      throw new Error(`Enhancement failed: ${error.message}`);
    }
  }

  buildPrompt(text, objective) {
    const objectiveGuide = {
      clarity: 'Enhance clarity while maintaining the main message',
      grammar: 'Fix grammatical errors only',
      concise: 'Make the message more concise while fixing grammatical errors'
    };

    return `
Please revise the following message:

"${text}"

Requirements:
- ${objectiveGuide[objective]}
- Maintain the original meaning
- Keep any technical terms intact
- Return ONLY the revised text without any additional explanations or formatting.
`;
  }
}

// Create enhancement icons container
const iconsContainer = document.createElement('div');
iconsContainer.className = 'message-enhancer-icons hidden';
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

// Initialize the enhancement service with the API key from storage
chrome.storage.sync.get(['apiKey'], (settings) => {
  if (settings.apiKey) {
    enhancementService = new EnhancementService(settings.apiKey);
  } else {
    console.error('OpenAI API key is not set in the extension settings.');
  }
});

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

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (!selectedText) return;

  try {
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(['apiKey'], resolve);
    });

    if (!settings.apiKey) {
      showError('Please set your OpenAI API key in the extension settings');
      return;
    }

    enhancementService.apiKey = settings.apiKey;
    const enhanced = await enhancementService.enhance(selectedText, objective);

    if (await showPreview(selectedText, enhanced)) {
      await replaceSelectedText(enhanced);
    }
  } catch (error) {
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
function showPreview(original, enhanced) {
  return new Promise((resolve) => {
    const preview = document.createElement('div');
    preview.className = 'message-enhancer-preview';
    
    // Clean up the enhanced text for preview
    const cleanedEnhanced = enhanced.trim().replace(/^\n+|\n+$/g, '');
    
    preview.innerHTML = `
      <div class="preview-content">
        <h3>Message Enhancement Preview</h3>
        <div class="preview-text">${cleanedEnhanced.replace(/\n/g, '<br>')}</div>
        <div class="preview-actions">
          <button class="cancel-btn">Cancel</button>
          <button class="apply-btn">Apply Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(preview);

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

    preview.querySelector('.cancel-btn').onclick = () => {
      preview.remove();
      resolve(false);
    };

    preview.querySelector('.apply-btn').onclick = () => {
      preview.remove();
      resolve(true);
    };
  });
}

function showError(message) {
  const error = document.createElement('div');
  error.className = 'message-enhancer-error';
  error.textContent = message;
  document.body.appendChild(error);
  setTimeout(() => error.remove(), 3000);
}
