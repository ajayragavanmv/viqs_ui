import React, { useState, useRef } from 'react';
import { Image, Send, Loader2 } from 'lucide-react';
import TextField from '@mui/material/TextField';
import { v4 as uuidv4 } from 'uuid';

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDuvpkhyUt1jHq2Gh9hb6O_YFGuQKuAdes';

const formatGeminiResponse = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<em>$1</em>')
    .replace(/\* (.*?)(?=\n|$)/g, '<li>$1</li>')
    .replace(/(<li>.*?<\/li>)\n*/g, '<ul>$1</ul>');
};

const Message = ({ message }) => (
  <div className={`message-wrapper ${message.sender}`}>
    <div className={`message ${message.sender}`}>
      {message.image && (
        <img 
          src={URL.createObjectURL(message.image)} 
          alt="Attached" 
          className="message-image"
        />
      )}
      {message.text && (
        <div dangerouslySetInnerHTML={{ __html: message.text }} />
      )}
    </div>
  </div>
);

const ChatInterface = () => {
  const [chatId] = useState(uuidv4());
  const [messages, setMessages] = useState([{ 
    id: 1, 
    text: 'Hello! How can I help you today?', 
    sender: 'model' 
  }]);
  
  const [history, setHistory] = useState([{
    role: 'model',
    parts: [{ text: 'Hello! How can I help you today?' }]
  }]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);



  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
    });
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      alert('Please select a JPEG or PNG image');
      return;
    }

    setIsLoading(true);
    try {
      const base64 = await convertToBase64(file);
      const newUserMessage = { id: Date.now(), image: file, sender: 'user' };
      setMessages(prev => [...prev, newUserMessage]);
      
      const response = await sendImageToGemini(base64);
      const newModelMessage = { id: Date.now() + 1, text: response, sender: 'model' };
      setMessages(prev => [...prev, newModelMessage]);
      
      setHistory(prev => [...prev,
        { role: 'user', parts: [{ text: ''}, {inline_data: { mime_type: 'image/png', data: base64 } }] },
        { role: 'model', parts: [{ text: response }] }
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendImageToGemini = async (imageBase64) => {
    try {
      const response = await fetch(GEMINI_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [...history, {
            role: 'user',
            parts: [
              { text: '' },
              {
                inline_data: {
                  mime_type: 'image/png',
                  data: imageBase64
                }
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const rawText = data.candidates[0]?.content?.parts[0]?.text;
      return rawText ? formatGeminiResponse(rawText) : 'Sorry, I could not analyze the image.';
    } catch (error) {
      console.error('Error:', error);
      return 'Sorry, I encountered an error processing the image.';
    }
  };

  const sendMessageToGemini = async (message) => {
    try {
      const response = await fetch(GEMINI_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [...history, {
            role: 'user',
            parts: [{ text: message }]
          }]
        })
      });

      const data = await response.json();
      const rawText = data.candidates[0]?.content?.parts[0]?.text;
      return rawText ? formatGeminiResponse(rawText) : 'Sorry, I could not process that.';
    } catch (error) {
      console.error('Error:', error);
      return 'Sorry, I encountered an error processing your request.';
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isLoading) return;

    const userMessage = { id: Date.now(), text: newMessage, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini(newMessage);
      const modelMessage = { id: Date.now() + 1, text: response, sender: 'model' };
      setMessages(prev => [...prev, modelMessage]);
      
      setHistory(prev => [...prev,
        { role: 'user', parts: [{ text: newMessage }] },
        { role: 'model', parts: [{ text: response }] }
      ]);
    } finally {
      setIsLoading(false);
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
          <Message key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="message-wrapper model">
            <div className="message model loading">
              <Loader2 className="spinner" size={20} />
            </div>
          </div>
        )}
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
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <button 
            className="attachment-button" 
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
          >
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