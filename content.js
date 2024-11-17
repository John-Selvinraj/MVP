let enhancementService;
let lastRange = null;

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
      
      return data.choices[0].message.content;
    } catch (error) {
      throw new Error(`Enhancement failed: ${error.message}`);
    }
  }

  buildPrompt(text, objective) {
    const objectiveGuide = {
      clarity: 'Enhance clarity while maintaining the main message',
      grammar: 'Fix grammatical errors only',
      concise: 'Make the message more concise'
    };

    return `
      Please revise the following message:
      "${text}"
      
      Requirements:
      - ${objectiveGuide[objective]}
      - Maintain the original meaning
      - Keep any technical terms intact
    `;
  }
}

// Create enhancement icons container
const iconsContainer = document.createElement('div');
iconsContainer.className = 'message-enhancer-icons hidden';
iconsContainer.innerHTML = `
  <button class="enhance-icon" data-objective="clarity" data-tooltip="Enhance Clarity">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  </button>
  <button class="enhance-icon" data-objective="grammar" data-tooltip="Fix Grammar">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  </button>
  <button class="enhance-icon" data-objective="concise" data-tooltip="Make Concise">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  </button>
`;

document.body.appendChild(iconsContainer);

// Initialize service
chrome.storage.sync.get(['apiKey'], (settings) => {
  enhancementService = new EnhancementService(settings.apiKey || '');
});

// Handle text selection
document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText && selection.rangeCount > 0) {
    lastRange = selection.getRangeAt(0);
    const rect = lastRange.getBoundingClientRect();
    
    // Position the icons near the selection
    iconsContainer.style.top = `${window.scrollY + rect.bottom + 10}px`;
    iconsContainer.style.left = `${window.scrollX + rect.left}px`;
    iconsContainer.classList.remove('hidden');
  }
});

// Handle keyboard selection (Ctrl+A)
document.addEventListener('keyup', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText && selection.rangeCount > 0) {
        lastRange = selection.getRangeAt(0);
        const rect = lastRange.getBoundingClientRect();
        
        iconsContainer.style.top = `${window.scrollY + rect.bottom + 10}px`;
        iconsContainer.style.left = `${window.scrollX + rect.left}px`;
        iconsContainer.classList.remove('hidden');
      }
    }, 100);
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
    const settings = await chrome.storage.sync.get(['apiKey']);
    if (!settings.apiKey) {
      showError('Please set your OpenAI API key in the extension settings');
      return;
    }

    enhancementService.apiKey = settings.apiKey;
    const enhanced = await enhancementService.enhance(selectedText, objective);

    if (await showPreview(selectedText, enhanced)) {
      replaceSelectedText(enhanced, lastRange);
    }
  } catch (error) {
    showError('Failed to enhance text: ' + error.message);
  } finally {
    iconsContainer.classList.add('hidden');
  }
}

function showPreview(original, enhanced) {
  return new Promise((resolve) => {
    const preview = document.createElement('div');
    preview.className = 'message-enhancer-preview';
    preview.innerHTML = `
      <div class="preview-content">
        <h3>Message Enhancement Preview</h3>
        <div class="preview-text">${enhanced.replace(/\n/g, '<br>')}</div>
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
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        preview.remove();
        resolve(false);
        document.removeEventListener('keydown', escapeHandler);
      }
    });

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

function replaceSelectedText(newText, range) {
  if (!range) return;

  const container = range.startContainer;
  const element = container.nodeType === 3 ? container.parentElement : container;
  const isGmail = window.location.hostname === 'mail.google.com';

  if (element.isContentEditable || 
      element.closest('[contenteditable="true"]') ||
      element.closest('[role="textbox"]')) {
    range.deleteContents();
    
    if (isGmail) {
      const paragraphs = newText.split('\n').filter(text => text.trim());
      const fragment = document.createDocumentFragment();
      
      paragraphs.forEach((text, index) => {
        if (index > 0) {
          fragment.appendChild(document.createElement('br'));
        }
        fragment.appendChild(document.createTextNode(text));
      });
      
      range.insertNode(fragment);
    } else {
      const textNode = document.createTextNode(newText);
      range.insertNode(textNode);
    }
  } else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    const input = element;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.substring(0, start) + newText + input.value.substring(end);
    input.setSelectionRange(start + newText.length, start + newText.length);
  }

  lastRange = null;
}

function showError(message) {
  const error = document.createElement('div');
  error.className = 'message-enhancer-error';
  error.textContent = message;
  document.body.appendChild(error);
  setTimeout(() => error.remove(), 3000);
}