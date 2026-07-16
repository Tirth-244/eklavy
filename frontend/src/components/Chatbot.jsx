import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import Markdown from 'react-markdown';
import './Chatbot.css';
import axios from 'axios';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi there! I'm the Eklavya AI Assistant. I can help you with questions about our courses, website, or education in general. How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setIsLoading(true);

    try {
      const baseURL = import.meta.env.VITE_API_URL || '/api';
      
      // Add placeholder bot message
      setMessages(prev => [...prev, { text: '', isBot: true }]);
      
      const response = await fetch(`${baseURL.replace(/\/api$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setIsLoading(false); // Stop loading spinner as soon as stream starts

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        botResponse += decoder.decode(value, { stream: true });
        
        // Update only the last message (the bot's response)
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { text: botResponse, isBot: true };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = 'Sorry, I am having trouble connecting right now. Please try again later.';
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { text: errorMessage, isBot: true };
        return newMessages;
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
      {isOpen && (
        <div className={`chatbot-window animate-scale-in ${isFullScreen ? 'fullscreen' : ''}`}>
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <MessageSquare size={20} />
              <h4>Eklavya Assistant</h4>
            </div>
            <div className="chatbot-header-actions">
              <button className="chatbot-action-btn" onClick={() => setIsFullScreen(!isFullScreen)}>
                {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button className="chatbot-action-btn" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbot-message ${msg.isBot ? 'bot' : 'user'}`}>
                <div className="chatbot-bubble">
                  {msg.isBot ? (
                    <div className="markdown-content">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message bot">
                <div className="chatbot-bubble loading">
                  <Loader2 size={16} className="spinner" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="chatbot-input"
              disabled={isLoading}
            />
            <button type="submit" className="chatbot-send-btn" disabled={!input.trim() || isLoading}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button className="chatbot-toggle-btn animate-fade-in" onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
          <span className="chatbot-toggle-text">Ask AI</span>
        </button>
      )}
    </div>
  );
};

export default Chatbot;
