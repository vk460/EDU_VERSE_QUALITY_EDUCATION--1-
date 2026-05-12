import { useState } from "react";
import axios from "axios";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input) return;

    const userMsg = { text: input, type: "user" };
    setMessages((prev) => [...prev, userMsg]);

    const res = await axios.post("http://localhost:8000/ask/", {
      question: input,
    });

    const botMsg = { text: res.data.answer, type: "bot" };
    setMessages((prev) => [...prev, botMsg]);

    setInput("");
  };

  return (
    <div>
      <div style={{ height: "250px", overflowY: "auto" }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              background: msg.type === "user" ? "#2563eb" : "#1e293b",
              padding: "10px",
              margin: "5px",
              borderRadius: "10px",
              textAlign: msg.type === "user" ? "right" : "left",
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;