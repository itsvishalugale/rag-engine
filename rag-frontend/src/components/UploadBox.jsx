import { useState, useRef } from "react";
import axios from "axios";

function UploadBox({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setStatus(null);
      } else {
        setStatus("error");
        setMessage("Only PDF files are supported.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("loading");
    setMessage("Uploading and re-indexing...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/upload", formData);
      setMessage(res.data.message || "File uploaded successfully.");
      setStatus("success");
      onUploadSuccess();
      setFile(null);
      // Auto clear success message after 4s
      setTimeout(() => setStatus(null), 4000);
    } catch (err) {
      setMessage("Upload failed. " + (err.response?.data?.detail || err.message));
      setStatus("error");
    }
  };

  const cancelSelection = () => {
    setFile(null);
    setStatus(null);
  };

  return (
    <div className="upload-wrapper">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div
        className={`drag-drop-zone ${isDragging ? "active" : ""}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <span className="drag-drop-icon">📤</span>
        <span className="drag-drop-text">
          {file ? file.name : "Choose or drag a PDF"}
        </span>
        {!file && <span className="drag-drop-subtext">Click to browse</span>}
      </div>

      {file && (
        <div className="upload-btn-row">
          <button
            className="upload-action-btn"
            onClick={handleUpload}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Processing..." : "Upload & Index"}
          </button>
          <button
            className="upload-cancel-btn"
            onClick={cancelSelection}
            disabled={status === "loading"}
            title="Cancel"
          >
            ✕
          </button>
        </div>
      )}

      {status && (
        <div className={`upload-status-msg ${status}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default UploadBox;
