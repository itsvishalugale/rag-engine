import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function ChatBox() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null); // tracking which message was copied
  const bottomRef = useRef(null);
  const controllerRef = useRef(null);
  const inputRef = useRef(null);

  // Quick suggestions for the user
  const suggestions = [
    {
      header: "Summarize content",
      text: "Provide a concise summary of the uploaded document(s).",
      prompt: "Can you summarize the uploaded document(s) and list the main key points?",
    },
    {
      header: "Extract key findings",
      text: "List the primary findings, statistics, or metrics.",
      prompt: "What are the key findings or data points mentioned in this file?",
    },
    {
      header: "Analyze structure",
      text: "Understand how the document is organized.",
      prompt: "Explain the structure of this document and what each section cover.",
    },
    {
      header: "General Q&A",
      text: "Ask direct questions about details.",
      prompt: "What is the main objective or goal of the project detailed in the document?",
    },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const sendMessage = async (userPrompt = null) => {
    const textToSend = userPrompt || query;
    if (!textToSend.trim() || loading) return;

    const userMsgId = Date.now();
    const userMsg = { type: "user", text: textToSend, id: userMsgId };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textToSend }),
        signal: controller.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const botMsgId = Date.now() + 1;
      const botMsg = { type: "bot", text: "", id: botMsgId };
      
      // Add empty bot message that will be streamed into
      setMessages((prev) => [...prev, botMsg]);

      let accumulatedText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedText += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          // Find and update the streaming message
          const idx = updated.findIndex((msg) => msg.id === botMsgId);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], text: accumulatedText };
          }
          return updated;
        });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: "An error occurred while fetching the response. Please check your backend connection.",
            id: Date.now(),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const stopStreaming = () => {
    controllerRef.current?.abort();
    setLoading(false);
  };

  const copyMessage = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    if (messages.length === 0) return;
    if (window.confirm("Are you sure you want to clear the conversation?")) {
      setMessages([]);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-window">
        {messages.length === 0 && (
          <div className="welcome-container">
            <div className="welcome-logo">✨</div>
            <h2 className="welcome-title">Welcome to Gemini RAG Assistant</h2>
            <p className="welcome-subtitle">
              Upload PDF documents in the sidebar and ask specific questions. The system utilizes semantic search and real-time streaming to answer.
            </p>

            <div className="suggestions-grid">
              {suggestions.map((s, idx) => (
                <div
                  key={idx}
                  className="suggestion-card"
                  onClick={() => sendMessage(s.prompt)}
                >
                  <span className="suggestion-header">{s.header}</span>
                  <span className="suggestion-text">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-wrapper ${msg.type === "user" ? "user" : "bot"}`}
          >
            <span className="message-sender">
              {msg.type === "user" ? "You" : "Assistant"}
            </span>
            <div className="message-card">
              {msg.type === "bot" ? (
                <ReactMarkdown>{msg.text || " "}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>

            {msg.type === "bot" && msg.text && (
              <div className="message-actions">
                <button
                  className="action-btn"
                  onClick={() => copyMessage(msg.text, msg.id)}
                >
                  {copiedId === msg.id ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && !messages[messages.length - 1]?.text && (
          <div className="skeleton-wrapper">
            <span className="message-sender">Assistant</span>
            <div className="skeleton-bubble">
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask a question about the indexed documents..."
            disabled={loading}
            className="chat-input"
          />

          <div className="input-actions-row">
            {messages.length > 0 && (
              <button
                className="input-btn clear"
                onClick={clearChat}
                title="Clear Chat"
                disabled={loading}
              >
                🗑️
              </button>
            )}

            {!loading ? (
              <button
                className="input-btn send"
                onClick={() => sendMessage()}
                disabled={!query.trim()}
              >
                Send ✦
              </button>
            ) : (
              <button className="input-btn stop" onClick={stopStreaming}>
                Stop ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;
