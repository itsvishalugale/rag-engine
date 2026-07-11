import { useState, useEffect } from "react";
import axios from "axios";
import ChatBox from "./components/ChatBox";
import UploadBox from "./components/UploadBox";
import "./index.css";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [theme, setTheme] = useState("dark"); // dark | light

  // Fetch document list on load
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/documents`);
      setDocuments(res.data || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  const deleteDocument = async (filename) => {
    try {
      await axios.delete(`${API_BASE}/documents/${filename}`);
      setDocuments((prev) => prev.filter((doc) => doc !== filename));
    } catch (err) {
      alert("Failed to delete document: " + (err.response?.data?.detail || err.message));
    }
  };

  const clearAllDocuments = async () => {
    if (!window.confirm("Are you sure you want to delete all documents?")) return;
    try {
      await axios.delete(`${API_BASE}/documents`);
      setDocuments([]);
    } catch (err) {
      alert("Failed to clear documents: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="app" data-theme={theme}>
      {/* Sidebar Panel */}
      <div className={`sidebar ${!sidebarOpen ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">G</div>
            <span className="sidebar-title">Gemini RAG</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle Theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              className="sidebar-collapse-btn"
              onClick={() => setSidebarOpen(false)}
              title="Hide Sidebar"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="upload-section">
          <UploadBox onUploadSuccess={fetchDocuments} />
        </div>

        <div className="document-list">
          <div className="document-list-header">
            <span className="document-list-title">Uploaded Files</span>
            {documents.length > 0 && (
              <button className="clear-all-btn" onClick={clearAllDocuments}>
                Clear All
              </button>
            )}
          </div>

          <div className="document-scroll-area">
            {documents.length === 0 ? (
              <div className="no-documents-placeholder">
                No documents uploaded yet. Upload a PDF above to begin.
              </div>
            ) : (
              documents.map((doc, i) => (
                <div key={i} className="document-item">
                  <div className="document-item-info">
                    <span className="document-item-icon">📄</span>
                    <span className="document-item-name" title={doc}>
                      {doc}
                    </span>
                  </div>
                  <button
                    className="document-item-delete"
                    onClick={() => deleteDocument(doc)}
                    title="Delete File"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="main-content">
        <div className="navbar">
          <div className="navbar-left">
            {!sidebarOpen && (
              <button
                className="sidebar-toggle-btn"
                onClick={() => setSidebarOpen(true)}
                title="Show Sidebar"
              >
                ☰
              </button>
            )}
            <h2 className="navbar-title">AI Knowledge Companion</h2>
          </div>
          <div className="navbar-status-badge">
            <div className="navbar-status-dot"></div>
            <span>Connected to Gemini</span>
          </div>
        </div>

        <ChatBox />
      </div>
    </div>
  );
}

export default App;
