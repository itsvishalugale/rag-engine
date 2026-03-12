import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function ChatBox() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const controllerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const sendMessage = async () => {
    if (!query.trim() || loading) return;

    const userMsg = { type: "user", text: query, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let botMsg = { type: "bot", text: "", id: Date.now() + 1 };
      setMessages((prev) => [...prev, botMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        botMsg.text += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...botMsg };
          return updated;
        });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: "Error occurred while getting response",
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

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    // You can add toast notification here later
  };

  return (
    <div className="chat-container">
      <div className="chat-window">
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              marginTop: "120px",
              color: "var(--text-secondary)",
            }}
          >
            <h2>Welcome to Smart RAG Assistant</h2>
            <p>Upload PDFs and start asking questions about them</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.type}`}>
            {msg.type === "bot" ? (
              <ReactMarkdown>{msg.text || " "}</ReactMarkdown>
            ) : (
              msg.text
            )}

            {msg.type === "bot" && msg.text && (
              <button
                className="copy-btn"
                onClick={() => copyMessage(msg.text)}
              >
                Copy
              </button>
            )}
          </div>
        ))}

        {loading && (
          <div className="message bot" style={{ maxWidth: "180px" }}>
            Thinking...
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
            placeholder="Ask about your documents..."
            disabled={loading}
          />

          {!loading ? (
            <button
              className="btn-send"
              onClick={sendMessage}
              disabled={!query.trim()}
            >
              Send
            </button>
          ) : (
            <button className="btn-stop" onClick={stopStreaming}>
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatBox;
