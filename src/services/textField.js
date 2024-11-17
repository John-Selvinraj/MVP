import { SUPPORTED_PLATFORMS } from '../config/platforms.js';

export class TextFieldService {
  constructor(enhancementService, settings) {
    this.enhancementService = enhancementService;
    this.settings = settings;
    this.observer = null;
    this.debounceTimer = null;
    this.initialized = new Set();
  }

  init() {
    const platform = this.getCurrentPlatform();
    if (!platform) return;

    const config = SUPPORTED_PLATFORMS[platform];
    const target = document.querySelector(config.observeTarget) || document.body;

    this.setupObserver(target);
    this.checkForTextFields();

    // Initial check for text fields
    setTimeout(() => this.checkForTextFields(), 1000);
  }

  setupObserver(target) {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  handleMutations(mutations) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.checkForTextFields(), 300);
  }

  checkForTextFields() {
    const platform = this.getCurrentPlatform();
    if (!platform) return;

    const config = SUPPORTED_PLATFORMS[platform];
    const textFields = document.querySelectorAll(config.selector);

    textFields.forEach(textField => {
      if (!textField.dataset.enhancerInitialized) {
        this.setupTextField(textField, config);
        textField.dataset.enhancerInitialized = 'true';
      }
    });
  }

  getCurrentPlatform() {
    return Object.keys(SUPPORTED_PLATFORMS).find(domain => 
      window.location.hostname.includes(domain)
    );
  }

  setupTextField(textField, config) {
    const container = document.createElement('div');
    container.className = 'message-enhancer-container';
    container.dataset.position = config.buttonPosition;

    const button = document.createElement('button');
    button.className = 'message-enhancer-btn';
    button.innerHTML = '✨';
    button.title = 'Enhance message';

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleEnhanceClick(textField, button);
    });

    container.appendChild(button);
    textField.parentElement.insertBefore(container, textField.nextSibling);
  }

  async handleEnhanceClick(textField, button) {
    try {
      const text = this.getTextContent(textField);
      if (!text.trim()) return;

      button.disabled = true;
      const enhanced = await this.enhancementService.enhance(text, this.settings);

      if (this.settings.showPreview) {
        if (await this.showPreview(text, enhanced)) {
          this.updateTextField(textField, enhanced);
        }
      } else {
        this.updateTextField(textField, enhanced);
      }
    } catch (error) {
      console.error('Enhancement failed:', error);
      this.showError('Failed to enhance message: ' + error.message);
    } finally {
      button.disabled = false;
    }
  }

  getTextContent(textField) {
    const platform = this.getCurrentPlatform();
    const isSlack = platform === 'app.slack.com';
    
    let text = '';
    if (textField.isContentEditable) {
      // For contenteditable fields, get innerHTML and clean it
      text = textField.innerHTML
        .replace(/<div><br><\/div>/g, '\n')  // Replace empty divs with newlines
        .replace(/<div>/g, '')               // Remove opening div tags
        .replace(/<\/div>/g, '\n')           // Replace closing div tags with newlines
        .replace(/<br>/g, '\n')              // Replace br tags with newlines
        .replace(/&nbsp;/g, ' ');            // Replace &nbsp; with spaces
      
      // Convert the HTML to plain text
      const temp = document.createElement('div');
      temp.innerHTML = text;
      text = temp.textContent;
    } else {
      text = textField.value;
    }

    // Trim whitespace but preserve internal line breaks
    text = text.split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n');

    return text;
  }

  updateTextField(textField, text) {
    const platform = this.getCurrentPlatform();
    const isSlack = platform === 'app.slack.com';
    
    if (textField.isContentEditable) {
      // Format text for contenteditable fields
      const formattedText = text
        .split('\n')
        .map(line => `<div>${line}</div>`)
        .join('');
      
      textField.innerHTML = formattedText;

      // For Slack, ensure cursor is at the end
      if (isSlack) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(textField);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      textField.value = text;
    }

    // Trigger input event to ensure platform's UI updates
    textField.dispatchEvent(new Event('input', { bubbles: true }));
  }

  showPreview(original, enhanced) {
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

  showError(message) {
    const error = document.createElement('div');
    error.className = 'message-enhancer-error';
    error.textContent = message;
    document.body.appendChild(error);
    setTimeout(() => error.remove(), 3000);
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    clearTimeout(this.debounceTimer);
  }
}