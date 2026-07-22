import React, { useState, useEffect, useRef } from 'react';
import socket from '../../socket';

const NegotiationChat = ({ chatData, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const myRole = currentUser.role || 'buyer';

  const getRoomId = () => {
    if (!chatData) return null;
    if (chatData.roomId) return chatData.roomId.toLowerCase().replace(/\s+/g, '_');
    
    const sellerKey = (chatData.seller_mobile || chatData.seller || 'seller').toString().toLowerCase();
    const buyerKey = (chatData.buyerMobile || chatData.buyer_mobile || chatData.buyer || currentUser.mobile || 'buyer').toString().toLowerCase();
    const cropKey = (chatData.name || chatData.crop || 'crop').toString().toLowerCase();

    return `room_${sellerKey}_${buyerKey}_${cropKey}`.replace(/\s+/g, '_');
  };

  const roomId = getRoomId();

  useEffect(() => {
    if (chatData && roomId) {
      // Connect to the room
      socket.emit('join_room', roomId);
    }
    
    // Listen for room history
    const handleHistory = (history) => {
      if (history && history.length > 0) {
        setMessages(history);
      } else if (chatData) {
        setMessages([
          { id: 1, sender: 'seller', text: `Namaste! Selling ${chatData.weight || 'bulk'}q of ${chatData.name} at ₹${chatData.rate}/q.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      }
    };

    // Listen for incoming websocket messages
    const handleReceive = (data) => {
      if (data && data.room === roomId && data.message) {
        setMessages((prev) => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    };

    socket.on('load_history', handleHistory);
    socket.on('receive_message', handleReceive);

    // Cleanup listeners when chat closes
    return () => {
      socket.off('load_history', handleHistory);
      socket.off('receive_message', handleReceive);
    };
  }, [chatData, roomId]);

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
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = { id: Date.now(), sender: myRole, text, time };
    
    setMessages(prev => [...prev, newMsg]);

    // Emit over WebSocket to the other person in the room!
    socket.emit('send_message', { room: roomId, message: newMsg });
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
        {messages.map((msg) => {
          const isMe = msg.sender === myRole;
          return (
            <div key={msg.id} className={`d-flex flex-column mb-3 ${isMe ? 'align-items-end' : 'align-items-start'}`}>
              <div style={{
                maxWidth: '80%', padding: '10px 15px', borderRadius: '15px',
                backgroundColor: isMe ? '#16a34a' : '#ffffff',
                color: isMe ? '#ffffff' : '#000000',
                borderBottomRightRadius: isMe ? '0' : '15px',
                borderBottomLeftRadius: isMe ? '15px' : '0',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}>
                <p className="m-0" style={{ fontSize: '0.9rem' }}>{msg.text}</p>
              </div>
              <small className="text-muted mt-1" style={{ fontSize: '10px' }}>{msg.time}</small>
            </div>
          );
        })}
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
