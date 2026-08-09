(function () {
  if (
    document.getElementById(
      "auc-atlas-ai-chat"
    )
  ) {
    return;
  }

  const chatbotStyles =
    document.createElement("style");

  chatbotStyles.textContent = `
    .ai-chatbot {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 140;
      font-family: Arial, sans-serif;
    }

    .ai-chatbot-toggle {
      width: 58px;
      height: 58px;
      border: 1px solid rgba(154, 112, 48, 0.28);
      border-radius: 50%;
      background: rgba(192, 154, 92, 0.96);
      box-shadow: 0 20px 48px rgba(42, 32, 20, 0.2);
      color: #ffffff;
      font: inherit;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.08em;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition:
        background 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;
    }

    .ai-chatbot-toggle:hover,
    .ai-chatbot-toggle:focus-visible {
      outline: none;
      background: #ac803b;
      box-shadow: 0 24px 58px rgba(42, 32, 20, 0.24);
      transform: translateY(-2px);
    }

    .ai-chatbot-panel {
      position: absolute;
      right: 0;
      bottom: 72px;
      width: min(390px, calc(100vw - 32px));
      height: min(590px, calc(100vh - 120px));
      overflow: hidden;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 28px;
      background: #f7f4ee;
      box-shadow: 0 28px 80px rgba(42, 32, 20, 0.2);
      display: grid;
      grid-template-rows:
        auto
        minmax(0, 1fr)
        auto
        auto;
    }

    .ai-chatbot-panel[hidden] {
      display: none;
    }

    .ai-chatbot-header {
      min-height: 76px;
      padding: 18px 20px;
      border-bottom: 1px solid rgba(23, 23, 23, 0.08);
      background: rgba(255, 255, 255, 0.76);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }

    .ai-chatbot-kicker {
      display: block;
      margin-bottom: 4px;
      color: rgba(192, 154, 92, 0.96);
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.12em;
      line-height: 1.4;
      text-transform: uppercase;
    }

    .ai-chatbot-header h2 {
      margin: 0;
      color: #171717;
      font-size: 20px;
      font-weight: 750;
      line-height: 1.2;
    }

    .ai-chatbot-close {
      width: 36px;
      height: 36px;
      flex: 0 0 36px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 50%;
      background: rgba(247, 244, 238, 0.8);
      color: rgba(23, 23, 23, 0.68);
      font: inherit;
      font-size: 20px;
      cursor: pointer;
      display: grid;
      place-items: center;
    }

    .ai-chatbot-messages {
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }

    .ai-chat-message {
      max-width: 86%;
      padding: 12px 14px;
      border: 1px solid rgba(23, 23, 23, 0.08);
      border-radius: 18px;
      color: #171717;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .ai-chat-message.assistant {
      align-self: flex-start;
      border-bottom-left-radius: 6px;
      background: rgba(255, 255, 255, 0.82);
    }

    .ai-chat-message.user {
      align-self: flex-end;
      border-color: rgba(192, 154, 92, 0.26);
      border-bottom-right-radius: 6px;
      background: rgba(192, 154, 92, 0.16);
    }

    .ai-chat-message.is-pending {
      color: rgba(23, 23, 23, 0.5);
      font-size: 13px;
    }

    .ai-chatbot-form {
      padding: 12px 14px;
      border-top: 1px solid rgba(23, 23, 23, 0.08);
      background: rgba(255, 255, 255, 0.72);
      display: grid;
      grid-template-columns:
        minmax(0, 1fr)
        46px;
      gap: 9px;
      align-items: end;
    }

    .ai-chatbot-input {
      width: 100%;
      min-height: 46px;
      max-height: 112px;
      padding: 12px 14px;
      resize: none;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.9);
      color: #171717;
      font: inherit;
      font-size: 14px;
      line-height: 1.5;
      outline: none;
    }

    .ai-chatbot-input:focus {
      border-color: rgba(192, 154, 92, 0.58);
      box-shadow: 0 0 0 3px rgba(192, 154, 92, 0.12);
    }

    .ai-chatbot-send {
      width: 46px;
      height: 46px;
      border: 1px solid rgba(192, 154, 92, 0.84);
      border-radius: 50%;
      background: rgba(192, 154, 92, 0.9);
      color: #ffffff;
      font: inherit;
      font-size: 20px;
      font-weight: 800;
      cursor: pointer;
      display: grid;
      place-items: center;
    }

    .ai-chatbot-send:disabled {
      cursor: wait;
      opacity: 0.52;
    }

    .ai-chatbot-note {
      margin: 0;
      padding: 0 16px 12px;
      background: rgba(255, 255, 255, 0.72);
      color: rgba(23, 23, 23, 0.5);
      font-size: 10px;
      font-weight: 600;
      line-height: 1.45;
      text-align: center;
    }

    .ai-chatbot-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (max-width: 560px) {
      .ai-chatbot {
        right: 14px;
        bottom: 14px;
      }

      .ai-chatbot-panel {
        width: calc(100vw - 28px);
        height: min(600px, calc(100dvh - 96px));
        border-radius: 24px;
      }
    }
  `;

  document.head.appendChild(
    chatbotStyles
  );

  const chatbotRoot =
    document.createElement("div");

  chatbotRoot.className = "ai-chatbot";
  chatbotRoot.id = "auc-atlas-ai-chat";
  chatbotRoot.innerHTML = `
    <button
      class="ai-chatbot-toggle"
      type="button"
      aria-label="Open Atlas AI chat"
      aria-controls="ai-chatbot-panel"
      aria-expanded="false"
    >AI</button>

    <section
      class="ai-chatbot-panel"
      id="ai-chatbot-panel"
      role="dialog"
      aria-labelledby="ai-chatbot-title"
      hidden
    >
      <header class="ai-chatbot-header">
        <div>
          <span class="ai-chatbot-kicker">Powered by Gemini</span>
          <h2 id="ai-chatbot-title">Atlas AI</h2>
        </div>

        <button
          class="ai-chatbot-close"
          type="button"
          aria-label="Close Atlas AI chat"
        >×</button>
      </header>

      <div
        class="ai-chatbot-messages"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div class="ai-chat-message assistant">Hi — I’m Atlas AI. Ask me how to use AUC Atlas or about general academic planning.</div>
      </div>

      <form class="ai-chatbot-form">
        <label
          class="ai-chatbot-sr-only"
          for="ai-chatbot-input"
        >Message Atlas AI</label>

        <textarea
          class="ai-chatbot-input"
          id="ai-chatbot-input"
          rows="1"
          maxlength="1000"
          placeholder="Ask Atlas AI..."
        ></textarea>

        <button
          class="ai-chatbot-send"
          type="submit"
          aria-label="Send message"
        >↑</button>
      </form>

      <p class="ai-chatbot-note">AI can make mistakes. Verify important information with official AUC sources.</p>
    </section>
  `;

  document.body.appendChild(chatbotRoot);

  const toggleButton =
    chatbotRoot.querySelector(
      ".ai-chatbot-toggle"
    );
  const closeButton =
    chatbotRoot.querySelector(
      ".ai-chatbot-close"
    );
  const panel =
    chatbotRoot.querySelector(
      ".ai-chatbot-panel"
    );
  const messagesRoot =
    chatbotRoot.querySelector(
      ".ai-chatbot-messages"
    );
  const form =
    chatbotRoot.querySelector(
      ".ai-chatbot-form"
    );
  const input =
    chatbotRoot.querySelector(
      ".ai-chatbot-input"
    );
  const sendButton =
    chatbotRoot.querySelector(
      ".ai-chatbot-send"
    );
  const history = [];

  let isSending = false;

  function setOpen(isOpen) {
    panel.hidden = !isOpen;

    toggleButton.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
    toggleButton.setAttribute(
      "aria-label",
      isOpen
        ? "Close Atlas AI chat"
        : "Open Atlas AI chat"
    );

    if (isOpen) {
      window.setTimeout(function () {
        input.focus();
      }, 0);
    }
  }

  function appendMessage(
    role,
    text,
    isPending
  ) {
    const message =
      document.createElement("div");

    message.className =
      "ai-chat-message " +
      role +
      (
        isPending
          ? " is-pending"
          : ""
      );
    message.textContent = text;

    messagesRoot.appendChild(message);
    messagesRoot.scrollTop =
      messagesRoot.scrollHeight;

    return message;
  }

  function trimHistory() {
    while (history.length > 12) {
      history.shift();
    }

    while (
      history.length &&
      history[0].role === "assistant"
    ) {
      history.shift();
    }
  }

  function setSending(nextValue) {
    isSending = nextValue;
    input.disabled = nextValue;
    sendButton.disabled = nextValue;
  }

  toggleButton.addEventListener(
    "click",
    function () {
      setOpen(panel.hidden);
    }
  );

  closeButton.addEventListener(
    "click",
    function () {
      setOpen(false);
      toggleButton.focus();
    }
  );

  input.addEventListener(
    "keydown",
    function (event) {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
      ) {
        event.preventDefault();
        form.requestSubmit();
      }
    }
  );

  document.addEventListener(
    "keydown",
    function (event) {
      if (
        event.key === "Escape" &&
        !panel.hidden
      ) {
        setOpen(false);
        toggleButton.focus();
      }
    }
  );

  form.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      const content =
        input.value.trim();

      if (!content || isSending) {
        return;
      }

      input.value = "";

      appendMessage(
        "user",
        content,
        false
      );

      history.push({
        role: "user",
        content
      });

      trimHistory();
      setSending(true);

      const pendingMessage =
        appendMessage(
          "assistant",
          "Thinking…",
          true
        );

      try {
        const response = await fetch(
          "/api/gemini-chat",
          {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
              Accept: "application/json",
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              messages: history
            })
          }
        );

        const data = await response
          .json()
          .catch(function () {
            return {};
          });

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Atlas AI could not respond right now."
          );
        }

        const reply = String(
          data.reply || ""
        ).trim();

        if (!reply) {
          throw new Error(
            "Atlas AI returned an empty response. Please try again."
          );
        }

        pendingMessage.remove();

        appendMessage(
          "assistant",
          reply,
          false
        );

        history.push({
          role: "assistant",
          content: reply
        });

        trimHistory();
      } catch (error) {
        pendingMessage.remove();

        if (
          history.length &&
          history[
            history.length - 1
          ].role === "user"
        ) {
          history.pop();
        }

        appendMessage(
          "assistant",
          String(
            error && error.message ||
              "Atlas AI could not respond right now."
          ),
          false
        );
      } finally {
        setSending(false);
        input.focus();
      }
    }
  );
})();
