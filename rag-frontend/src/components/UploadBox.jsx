import { useState } from "react";
import axios from "axios";

function UploadBox({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // null | success | error
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    setStatus("loading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/upload", formData);
      setMessage(res.data.message || "File uploaded successfully");
      setStatus("success");
      onUploadSuccess(file.name);
      setFile(null);
    } catch (err) {
      setMessage("Upload failed. " + (err.response?.data?.detail || ""));
      setStatus("error");
    }
  };

  return (
    <div className="upload-wrapper">
      <label className="upload-label">
        {file ? file.name : "Choose PDF file"}
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </label>

      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={!file || status === "loading"}
      >
        {status === "loading" ? "Uploading..." : "Upload"}
      </button>

      {status && status !== "loading" && (
        <div className={`upload-message ${status}`}>{message}</div>
      )}
    </div>
  );
}

export default UploadBox;
