import React, { useState, useEffect, useRef } from 'react';

const NegotiationChat = ({ chatData, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatData) {
      // Load initial greeting message
      setMessages([
        { id: 1, sender: 'seller', text: `Namaste! I have ${chatData.weight}q of ${chatData.name} available at ₹${chatData.rate}/q. Are you interested?`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }
  }, [chatData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(inputText);
    setInputText('');
  };

  const sendMessage = (text) => {
    const newMsg = { id: Date.now(), sender: 'buyer', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);

    // Simulate seller reply
    setTimeout(() => {
      const reply = { id: Date.now() + 1, sender: 'seller', text: "Let me check the mandi rates and get back to you.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => [...prev, reply]);
    }, 2000);
  };

  const sendOffer = (discount) => {
    const offerPrice = parseInt(chatData.rate) - discount;
    sendMessage(`I would like to make a counter-offer: ₹${offerPrice}/q for the entire lot.`);
  };

  if (!chatData) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', width: '350px', height: '500px',
      backgroundColor: '#f8fafc', borderRadius: '15px', boxShadow: '0 15px 40px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column', zIndex: 1050, overflow: 'hidden',
      border: '1px solid #cbd5e1'
    }}>
      {/* Header */}
      <div className="bg-success text-white p-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-user"></i>
          </div>
          <div>
            <h6 className="m-0 fw-bold">{chatData.seller}</h6>
            <small style={{ fontSize: '11px', opacity: 0.8 }}>Selling: {chatData.name}</small>
          </div>
        </div>
        <button className="btn text-white p-0" onClick={onClose}><i className="fas fa-times fa-lg"></i></button>
      </div>

      {/* Messages */}
      <div className="flex-grow-1 p-3" style={{ overflowY: 'auto', backgroundColor: '#e2e8f0', backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}>
        {messages.map(msg => (
          <div key={msg.id} className={`d-flex flex-column mb-3 ${msg.sender === 'buyer' ? 'align-items-end' : 'align-items-start'}`}>
            <div style={{
              maxWidth: '80%', padding: '10px 15px', borderRadius: '15px',
              backgroundColor: msg.sender === 'buyer' ? '#16a34a' : '#ffffff',
              color: msg.sender === 'buyer' ? '#ffffff' : '#000000',
              borderBottomRightRadius: msg.sender === 'buyer' ? '0' : '15px',
              borderBottomLeftRadius: msg.sender === 'seller' ? '0' : '15px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
              <p className="m-0" style={{ fontSize: '0.9rem' }}>{msg.text}</p>
            </div>
            <small className="text-muted mt-1" style={{ fontSize: '10px' }}>{msg.time}</small>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Offers */}
      <div className="bg-white p-2 border-top d-flex gap-2 overflow-auto" style={{ whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
        <button className="btn btn-sm btn-outline-success rounded-pill" onClick={() => sendOffer(50)}>-₹50/q Offer</button>
        <button className="btn btn-sm btn-outline-success rounded-pill" onClick={() => sendOffer(100)}>-₹100/q Offer</button>
        <button className="btn btn-sm btn-outline-success rounded-pill" onClick={() => sendMessage("Can you arrange transport?")}>Ask Transport</button>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white p-3 border-top d-flex gap-2 align-items-center">
        <input 
          type="text" 
          className="form-control rounded-pill bg-light border-0" 
          placeholder="Type message..." 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <button type="submit" className="btn btn-success rounded-circle" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default NegotiationChat;
