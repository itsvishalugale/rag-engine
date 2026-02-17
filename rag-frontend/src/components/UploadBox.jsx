import axios from "axios";
import { useState } from "react";

function UploadBox() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/upload", formData);
      setMessage(res.data.message);
    } catch (error) {
      setMessage("Upload failed");
    }
  };

  return (
    <div className="upload-box">
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload PDF</button>
      {message && <p className="upload-message">{message}</p>}
    </div>
  );
}

export default UploadBox;
