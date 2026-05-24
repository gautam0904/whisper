export function getInjectionScript(text: string): string {
    const escapedText = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
    return `
(function(text) {
    if (!text || document.readyState !== 'complete') return;

    let target = null;

    const selectors = [
        '#prompt-textarea',
        '.ProseMirror div[contenteditable="true"]',
        '.ProseMirror',
        'div.ql-editor',
        'textarea[placeholder]',
        'textarea',
        '[contenteditable="true"]'
    ];

    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
            target = el;
            break;
        }
    }

    if (!target) return;

    const isContentEditable = target.isContentEditable || target.hasAttribute('contenteditable');
    const isTextarea = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';

    const textToInsert = text.trim() + " ";

    target.focus();

    if (isTextarea) {
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const currentValue = target.value;
        const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(target, newValue);
        } else {
            target.value = newValue;
        }

        target.selectionStart = target.selectionEnd = start + textToInsert.length;

        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (isContentEditable) {
        document.execCommand('insertText', false, textToInsert);
        target.dispatchEvent(new Event('input', { bubbles: true }));
    }
})('${escapedText}');
`;
}
