import { useCallback } from 'react';
import { injectJavascript } from '../../../shared/services/windowService';

export function useAIInjection() {
    const injectTextToAI = useCallback(async (text: string, autoSubmit: boolean, providerId: string): Promise<boolean> => {
        let script = '';

        if (providerId === 'chatgpt') {
            script = `
                (function() {
                    const textarea = document.querySelector('textarea[placeholder*="Message"]')
                                  || document.querySelector('textarea[placeholder*="Ask"]')
                                  || document.querySelector('#prompt-textarea')
                                  || document.querySelector('textarea');

                    if (!textarea) return false;

                    textarea.focus();
                    textarea.value = '';

                    const text = ${JSON.stringify(text)};
                    let i = 0;

                    const typeInterval = setInterval(() => {
                        if (i < text.length) {
                            textarea.value += text[i];
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                            i++;
                        } else {
                            clearInterval(typeInterval);

                            if (${autoSubmit}) {
                                setTimeout(() => {
                                    const submitBtn = textarea.nextElementSibling
                                                   || document.querySelector('button[data-testid="send-button"]')
                                                   || document.querySelector('button[aria-label="Send message"]')
                                                   || document.querySelector('button[aria-label="Send"]');
                                    if (submitBtn && !submitBtn.disabled) {
                                        submitBtn.click();
                                    } else {
                                        const enterEvent = new KeyboardEvent('keydown', {
                                            key: 'Enter',
                                            code: 'Enter',
                                            keyCode: 13,
                                            which: 13,
                                            bubbles: true
                                        });
                                        textarea.dispatchEvent(enterEvent);
                                    }
                                }, 500);
                            }
                        }
                    }, 50);
                })();
            `;
        } else if (providerId === 'gemini') {
            script = `
                (function() {
                    const input = document.querySelector('div[contenteditable="true"]')
                               || document.querySelector('.ql-editor')
                               || document.querySelector('textarea');
                    if (!input) return false;

                    input.focus();
                    const text = ${JSON.stringify(text)};
                    let i = 0;

                    if (input.tagName === 'DIV') {
                        input.innerText = '';
                    } else {
                        input.value = '';
                    }

                    const typeInterval = setInterval(() => {
                        if (i < text.length) {
                            if (input.tagName === 'DIV') {
                                input.innerText += text[i];
                            } else {
                                input.value += text[i];
                            }
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            i++;
                        } else {
                            clearInterval(typeInterval);
                            if (${autoSubmit}) {
                                setTimeout(() => {
                                    const btn = document.querySelector('button[aria-label="Send message"]')
                                             || document.querySelector('button.send-button');
                                    if (btn) btn.click();
                                }, 500);
                            }
                        }
                    }, 50);
                })();
            `;
        } else {
            script = `
                (function() {
                    const input = document.querySelector('div[contenteditable="true"]')
                               || document.querySelector('textarea');
                    if (!input) return false;

                    input.focus();
                    if (input.tagName === 'DIV') {
                        input.innerText = ${JSON.stringify(text)};
                    } else {
                        input.value = ${JSON.stringify(text)};
                    }
                    input.dispatchEvent(new Event('input', { bubbles: true }));

                    if (${autoSubmit}) {
                        setTimeout(() => {
                            const btn = document.querySelector('button[type="submit"]')
                                     || document.querySelector('button[aria-label*="Send"]');
                            if (btn) btn.click();
                        }, 500);
                    }
                })();
            `;
        }

        try {
            await injectJavascript(script);
            return true;
        } catch {
            return false;
        }
    }, []);

    return { injectTextToAI };
}
