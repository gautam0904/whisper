(function () {
  function queryDeep(selector, root) {
    root = root || document;
    try {
      var el = root.querySelector(selector);
      if (el) return el;
    } catch (e) {}
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      if (all[i].shadowRoot) {
        var found = queryDeep(selector, all[i].shadowRoot);
        if (found) return found;
      }
    }
    return null;
  }

  function findInput(customSelector) {
    if (customSelector) {
      return queryDeep(customSelector) || document.querySelector(customSelector);
    }
    var selectors = [
      'div#prompt-textarea[contenteditable="true"]',
      'div#prompt-textarea',
      '[data-testid="prompt-textarea"]',
      'div.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][data-placeholder]',
      '.ProseMirror',
      'rich-textarea',
      'textarea[placeholder]',
      'textarea',
      '[contenteditable="true"]',
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = queryDeep(selectors[i]);
      if (el) return { el: el, selector: selectors[i] };
    }
    return null;
  }

  function insertIntoElement(el, text, shouldAppend) {
    el.focus();

    var isTextarea = el.tagName === "TEXTAREA" || el.tagName === "INPUT";

    if (isTextarea) {
      var start = el.selectionStart || 0;
      var end = el.selectionEnd || 0;
      var current = el.value || "";
      var newVal = shouldAppend
        ? current.slice(0, start) + text + current.slice(end)
        : text;
      var setter =
        Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        )?.set ||
        Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
      if (setter) setter.call(el, newVal);
      else el.value = newVal;
      el.selectionStart = el.selectionEnd = newVal.length;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    // contenteditable / ProseMirror (ChatGPT, Claude)
    try {
      var sel = window.getSelection();
      var range = document.createRange();
      if (shouldAppend) {
        range.selectNodeContents(el);
        range.collapse(false);
      } else {
        range.selectNodeContents(el);
      }
      sel.removeAllRanges();
      sel.addRange(range);

      try {
        el.dispatchEvent(
          new InputEvent("beforeinput", {
            bubbles: true,
            cancelable: true,
            inputType: "insertText",
            data: text,
          })
        );
      } catch (e) {}

      var ok = document.execCommand("insertText", false, text);

      if (!ok) {
        if (shouldAppend) {
          el.textContent = (el.textContent || "") + (el.textContent ? " " : "") + text;
        } else {
          el.textContent = text;
        }
      }

      try {
        el.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: text,
          })
        );
      } catch (e) {
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }

      // paste fallback for stubborn React editors
      if (!el.textContent || el.textContent.indexOf(text.trim().slice(0, 8)) === -1) {
        try {
          var dt = new DataTransfer();
          dt.setData("text/plain", text);
          el.dispatchEvent(
            new ClipboardEvent("paste", {
              bubbles: true,
              cancelable: true,
              clipboardData: dt,
            })
          );
        } catch (e2) {}
      }

      return true;
    } catch (err) {
      console.error("[Whisper Inject] contenteditable error", err);
      return false;
    }
  }

  function tryInject(text, shouldAppend, customSelector) {
    var found = findInput(customSelector || null);
    if (!found || !found.el) {
      return { ok: false, error: "no_input" };
    }
    var ok = insertIntoElement(found.el, text, !!shouldAppend);
    return { ok: ok, selector: found.selector };
  }

  function startPendingPoll() {
    if (globalThis.__whisperPollId) return;
    globalThis.__whisperPollId = setInterval(function () {
      var p = globalThis.__whisperPendingText;
      if (!p) {
        clearInterval(globalThis.__whisperPollId);
        globalThis.__whisperPollId = null;
        return;
      }
      p.tries = (p.tries || 0) + 1;
      if (p.tries > 40) {
        console.error("[Whisper Inject] gave up waiting for textbox");
        globalThis.__whisperPendingText = null;
        clearInterval(globalThis.__whisperPollId);
        globalThis.__whisperPollId = null;
        return;
      }
      var result = tryInject(p.text, p.shouldAppend, p.customSelector);
      if (result.ok) {
        console.log("[Whisper Inject] delayed inject OK", result);
        globalThis.__whisperPendingText = null;
        clearInterval(globalThis.__whisperPollId);
        globalThis.__whisperPollId = null;
      }
    }, 500);
  }

  globalThis.__whisperInjectText = function (text, shouldAppend, customSelector) {
    var result = tryInject(text, !!shouldAppend, customSelector || null);
    if (result.ok) {
      console.log("[Whisper Inject] done", { selector: result.selector, len: text.length });
      return result;
    }
    console.warn("[Whisper Inject] textbox not ready — will retry");
    globalThis.__whisperPendingText = {
      text: text,
      shouldAppend: !!shouldAppend,
      customSelector: customSelector || null,
      tries: 0,
    };
    startPendingPoll();
    return { ok: false, error: "no_input", pending: true };
  };
})();
