import ChatBox from "./components/ChatBox";
import UploadBox from "./components/UploadBox";

function App() {
  return (
    <div className="app">
      <div className="card">
        <h1 className="title">Smart RAG Assistant</h1>
        <UploadBox />
        <ChatBox />
      </div>
    </div>
  );
}

export default App;
