import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import "./StoryChat.css";

const SUGGESTED_QUESTIONS = [
  "Who were the biggest losers in this story?",
  "What could have been done differently?",
  "What happens next in this story?",
  "Explain this story in simple terms",
];

function TypingIndicator() {
  return (
    <div className="chat-message chat-message-ai">
      <div className="chat-bubble chat-bubble-ai">
        <div className="chat-typing">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`chat-message ${isUser ? "chat-message-user" : "chat-message-ai"}`}>
      {!isUser && (
        <div className="chat-avatar">
          <span>ET</span>
        </div>
      )}
      <div className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}`}>
        <p className="chat-bubble-text">{message.content}</p>
        {!isUser && message.citations?.length > 0 && (
          <div className="chat-citations">
            {message.citations.map((citation, index) => (
              <span key={`${citation}-${index}`} className="chat-citation-pill">
                {citation}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoryChat({ storyData, topic }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
      setHasUnread(false);
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (storyData) {
      setMessages([
        {
          role: "ai",
          content: `I've analysed the full story arc on "${topic}". Ask me anything — about the key players, what really happened, what mainstream coverage missed, or what to expect next.`,
        },
      ]);
    }
  }, [storyData , topic]);

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question || loading) return;

    const userMessage = { role: "user", content: question };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          storyData,
          messages: updatedMessages,
        }),
      });

      if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
      const data = await res.json();

      const aiMessage = {
        role: "ai",
        content: data.answer,
        citations: data.citations || [],
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (!isOpen) setHasUnread(true);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Sorry, I couldn't process that. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!storyData) return null;

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-header-avatar">ET</div>
              <div>
                <p className="chat-header-title">Ask about this story</p>
                <p className="chat-header-sub">{topic}</p>
              </div>
            </div>
            <button
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions — only show if only welcome message exists */}
          {messages.length === 1 && !loading && (
            <div className="chat-suggestions">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  className="chat-suggestion-pill"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-wrap">
            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              placeholder="Ask anything about this story..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className={`chat-send-btn ${input.trim() ? "active" : ""}`}
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Fixed bottom trigger bar */}
      <div className="chat-trigger-bar">
        <button
          className="chat-trigger-btn"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? (
            <>
              <X size={16} />
              <span>Close chat</span>
            </>
          ) : (
            <>
              <MessageCircle size={16} />
              <span>Ask about this story</span>
              {hasUnread && <span className="chat-unread-dot" />}
            </>
          )}
        </button>

        {/* Suggested quick questions in the bar when closed */}
        {!isOpen && (
          <div className="chat-bar-suggestions">
            {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
              <button
                key={q}
                className="chat-bar-pill"
                onClick={() => {
                  setIsOpen(true);
                  setTimeout(() => sendMessage(q), 100);
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}