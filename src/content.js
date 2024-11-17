// Only run on Slack domains
if (!window.location.hostname.includes('slack.com')) {
  return;
}

function initializeSlackIntegration() {
  const observer = new MutationObserver(() => {
    const editor = document.querySelector('[data-qa="message_input"], [contenteditable="true"].ql-editor');
    if (editor) {
      setupEnhancementButtons(editor);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function setupEnhancementButtons(textField) {
  textField.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText) {
      showEnhancementButtons(selection);
    } else {
      document.querySelectorAll('.message-enhancer-icons').forEach(el => el.remove());
    }
  });
}

function showEnhancementButtons(selection) {
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'message-enhancer-icons';
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  buttonsContainer.style.top = `${rect.bottom + window.scrollY + 10}px`;
  buttonsContainer.style.left = `${rect.left + window.scrollX}px`;
  
  ['clarity', 'grammar', 'concise'].forEach(objective => {
    const button = createEnhanceButton(objective, selection);
    buttonsContainer.appendChild(button);
  });
  
  document.querySelectorAll('.message-enhancer-icons').forEach(el => el.remove());
  document.body.appendChild(buttonsContainer);
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializeSlackIntegration);
initializeSlackIntegration();