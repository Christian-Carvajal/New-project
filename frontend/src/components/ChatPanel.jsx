import { useEffect, useRef, useState } from "react";

function formatTime(timestamp) {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit"
  }).format(timestamp);
}

export default function ChatPanel({ disabled, meId, messages, onSend }) {
  const [draft, setDraft] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    const logElement = logRef.current;

    if (!logElement) {
      return;
    }

    logElement.scrollTo({
      top: logElement.scrollHeight,
      behavior: messages.length > 1 ? "smooth" : "auto"
    });
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    const outgoingDraft = draft;
    setDraft("");

    try {
      await onSend(outgoingDraft);
    } catch {
      setDraft(outgoingDraft);
    }
  }

  return (
    <section className="panel chat-panel">
      <div className="section-header compact">
        <div>
          <span className="eyebrow">Room Chat</span>
          <h2>Keep the room talking</h2>
        </div>
        <span className="status-pill">{disabled ? "Offline" : "Live"}</span>
      </div>

      <div className="chat-log" ref={logRef}>
        {messages.length ? (
          messages.map((message) => (
            <article
              className={`chat-message ${message.system ? "system" : message.senderId === meId ? "self" : "other"}`}
              key={message.id}
            >
              <div className="chat-meta">
                <strong>{message.senderName}</strong>
                <span>{formatTime(message.timestamp)}</span>
              </div>
              <p>{message.text}</p>
            </article>
          ))
        ) : (
          <div className="chat-empty">
            <p>No messages yet. Use chat for hints, banter, and coordinating the next round.</p>
          </div>
        )}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          aria-label="Message the room"
          disabled={disabled}
          maxLength={240}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={disabled ? "Reconnect to chat" : "Send a quick message"}
          value={draft}
        />
        <button className="secondary-button" disabled={disabled} type="submit">
          Send
        </button>
      </form>
    </section>
  );
}
