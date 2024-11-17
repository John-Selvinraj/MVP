export const SUPPORTED_PLATFORMS = {
  'app.slack.com': {
    selector: '.ql-editor[contenteditable="true"], [data-qa="message_input"], [data-qa="texty_message_input"]',
    inputType: 'contenteditable',
    buttonPosition: 'right',
    observeTarget: '.p-workspace__primary_view_contents'
  },
  'teams.microsoft.com': {
    selector: '[role="textbox"][contenteditable="true"], .cke_editable',
    inputType: 'contenteditable',
    buttonPosition: 'right',
    observeTarget: '[data-tid="message-pane"]'
  },
  'mail.google.com': {
    selector: 'div[role="textbox"][contenteditable="true"], .Am.Al.editable',
    inputType: 'contenteditable',
    buttonPosition: 'top',
    observeTarget: '.AO'
  }
};