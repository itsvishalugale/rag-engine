import { useState } from "react";
import ChatBox from "./components/ChatBox";
import UploadBox from "./components/UploadBox";
import "./index.css";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [theme, setTheme] = useState("dark"); // dark | light

  return (
    <div className="app" data-theme={theme}>
      <div className={`sidebar ${!sidebarOpen ? "collapsed" : ""}`}>
        <div className="header">
          <h1 className="title">Smart RAG</h1>
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="upload-section">
          <UploadBox
            onUploadSuccess={(filename) => {
              setDocuments((prev) => [...prev, filename]);
            }}
          />
        </div>

        <div className="document-list">
          <h3 style={{ marginBottom: "12px", color: "var(--text-secondary)" }}>
            Uploaded Documents
          </h3>
          {documents.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              No documents uploaded yet
            </div>
          ) : (
            documents.map((doc, i) => (
              <div key={i} className="document-item">
                <span>📄</span> {doc}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "1.4rem",
                cursor: "pointer",
              }}
            >
              ☰
            </button>
          )}
          <h2>Document Assistant</h2>
        </div>

        <ChatBox />
      </div>
    </div>
  );
}

export default App;
