export class TextFieldDetector {
  static supportedPlatforms = {
    'slack.com': {
      selector: '[data-qa="message_input"], [contenteditable="true"].ql-editor',
      inputType: 'contenteditable'
    },
    'mail.google.com': {
      selector: '[role="textbox"], .Am.Al.editable, [contenteditable="true"]',
      inputType: 'contenteditable'
    }
  };

  static detectTextField() {
    const platform = Object.keys(this.supportedPlatforms).find(domain => 
      window.location.hostname.includes(domain)
    );

    if (!platform) {
      console.log('Platform not supported');
      return null;
    }

    const config = this.supportedPlatforms[platform];
    const element = document.querySelector(config.selector);
    
    console.log(`Detected ${platform} text field:`, element);
    return element;
  }

  static injectEnhanceButton(textField) {
    const button = document.createElement('button');
    button.className = 'message-enhancer-btn';
    button.innerHTML = '✨ Enhance';
    
    // Position the button near the text field
    const fieldRect = textField.getBoundingClientRect();
    button.style.top = `${fieldRect.top}px`;
    button.style.left = `${fieldRect.right + 10}px`;
    
    document.body.appendChild(button);
    return button;
  }
}