import React, { useState } from 'react';
import { Image, Send } from 'lucide-react';
import TextField from '@mui/material/TextField';

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDuvpkhyUt1jHq2Gh9hb6O_YFGuQKuAdes';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! How can I help you today?', sender: 'bot' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessageToGemini = async (message) => {
    try {
      const response = await fetch(GEMINI_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error:', error);
      return 'Sorry, I encountered an error processing your request.';
    }
  };

  const handleSend = async () => {
    if (newMessage.trim() && !isLoading) {
      const userMessage = { id: Date.now(), text: newMessage, sender: 'user' };
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      setIsLoading(true);

      try {
        const response = await sendMessageToGemini(newMessage);
        const botMessage = { id: Date.now() + 1, text: response, sender: 'bot' };
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-area">
        {messages.map((message) => (
          <div key={message.id} className={`message-wrapper ${message.sender}`}>
            <div className={`message ${message.sender}`}>{message.text}</div>
          </div>
        ))}
      </div>
      <div className="input-area">
        <div className="input-container">
          <TextField
            fullWidth
            variant="standard"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            InputProps={{ 
              disableUnderline: true,
              className: 'chat-input'
            }}
            disabled={isLoading}
          />
          <button className="attachment-button" disabled={isLoading}>
            <Image size={20} />
          </button>
          <button onClick={handleSend} className="send-button" disabled={isLoading}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;