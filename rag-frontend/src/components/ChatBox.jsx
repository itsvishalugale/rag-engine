import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function ChatBox() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!query.trim()) return;

    setLoading(true);

    const userMessage = { type: "user", text: query };
    setMessages((prev) => [...prev, userMessage]);

    const controller = new AbortController();
    controllerRef.current = controller;

    setQuery("");

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let botMessage = { type: "bot", text: "" };

      setMessages((prev) => [...prev, botMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        botMessage.text += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...botMessage };
          return updated;
        });
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Streaming stopped by user.");
      } else {
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: "Error fetching answer" },
        ]);
      }
    }

    setLoading(false);
  };

  const stopStreaming = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            {msg.type === "bot" ? (
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            ) : (
              <p>{msg.text}</p>
            )}
          </div>
        ))}

        {loading && <div className="typing">Typing...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask something..."
          disabled={loading}
        />

        {!loading ? (
          <button onClick={sendMessage}>Send</button>
        ) : (
          <button onClick={stopStreaming} className="stop-btn">
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatBox;
