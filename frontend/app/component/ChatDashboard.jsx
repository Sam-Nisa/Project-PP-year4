"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import api from "../utils/axios";
import { useAuthStore } from "../store/authStore";
import { 
  Search, 
  Send, 
  MoreHorizontal, 
  Phone, 
  Video, 
  Paperclip, 
  Smile, 
  Image as ImageIcon, 
  MapPin,
  Check,
  CheckCheck,
  Trash2,
  Reply,
  Edit2,
  Copy
} from "lucide-react";

export default function ChatDashboard() {
  const searchParams = useSearchParams();
  const { user, token, isInitialized } = useAuthStore();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const messagesEndRef = useRef(null);
  const pollingInterval = useRef(null);
  const contactIdParam = searchParams.get('contact');

  useEffect(() => {
    if (!isInitialized || !token) return;
    
    fetchContacts();
    const contactInterval = setInterval(() => {
      fetchContacts();
    }, 5000);
    return () => {
      clearInterval(contactInterval);
    };
  }, [isInitialized, token, contactIdParam]); // Added contactIdParam to trigger refetch when URL changes

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      pollingInterval.current = setInterval(() => {
        fetchMessages(selectedContact.id, false);
      }, 3000);
    } else {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    }
  }, [selectedContact]);

  const prevMessageCountRef = useRef(0);
  const prevContactIdRef = useRef(null);

  useEffect(() => {
    const isNewContact = selectedContact?.id !== prevContactIdRef.current;
    const hasNewMessages = messages.length > prevMessageCountRef.current;
    
    if (isNewContact || hasNewMessages) {
      // Small timeout to allow DOM to update before scrolling
      setTimeout(scrollToBottom, 50);
    }
    
    prevMessageCountRef.current = messages.length;
    prevContactIdRef.current = selectedContact?.id;
  }, [messages.length, selectedContact?.id]);

  const fetchContacts = async () => {
    try {
      const url = contactIdParam ? `/api/messages/contacts?contact_id=${contactIdParam}` : "/api/messages/contacts";
      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // response.data is the array of contacts directly
      const fetchedContacts = response.data || [];
      setContacts(fetchedContacts);

      // Auto-select the contact if provided in URL and not already selected
      if (contactIdParam) {
         const contactToSelect = fetchedContacts.find(c => c.id === parseInt(contactIdParam));
         if (contactToSelect) {
            setSelectedContact(prev => {
                // Only select if not already selected, to prevent resetting chat on poll
                if (!prev || prev.id !== contactToSelect.id) {
                    return contactToSelect;
                }
                return prev;
            });
         }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setLoading(false);
    }
  };

  const fetchMessages = async (contactId, showLoading = true) => {
    try {
      const response = await api.get(`/api/messages/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // response.data is the array of messages directly
      setMessages(response.data || []);
      
      // Update unread count for this contact to 0
      setContacts(prev => prev.map(c => 
        c.id === contactId ? { ...c, unread_count: 0 } : c
      ));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    const messageText = newMessage;
    setNewMessage("");

    // Optimistic UI update
    const tempMessage = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: selectedContact.id,
      message: messageText,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await api.post("/api/messages", {
        receiver_id: selectedContact.id,
        message: messageText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Replace temp message with real one from server
      setMessages(prev => prev.map(msg => msg.id === tempMessage.id ? response.data : msg));
      
      // Also refresh contacts to update order or latest message if needed
      fetchContacts();
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove temp message if failed
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await api.delete(`/api/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.filter(msg => msg.id !== msgId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedContact) return;
    if (!confirm("Are you sure you want to delete this entire conversation?")) return;
    
    try {
      await api.delete(`/api/messages/conversation/${selectedContact.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([]);
      setSelectedContact(null);
      fetchContacts();
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleUpdateMessage = async (msgId) => {
    if (!editedText.trim()) return;
    try {
      const response = await api.put(`/api/messages/${msgId}`, { message: editedText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.map(msg => msg.id === msgId ? response.data.data : msg));
      setEditingMessageId(null);
      setEditedText("");
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <React.Suspense fallback={<div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <div className="flex h-[80vh] min-h-[600px] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Sidebar */}
        <div className="w-1/3 min-w-[300px] border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="p-5 border-b border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-600">Messages</h2>
              <button className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition">
                <MoreHorizontal size={20} />
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm shadow-sm transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredContacts.length > 0 ? (
              <div className="py-2">
                <div className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  All Messages
                </div>
                {filteredContacts.map(contact => (
                  <div 
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`flex items-center px-5 py-3 cursor-pointer transition border-l-4 ${
                      selectedContact?.id === contact.id 
                        ? "bg-blue-50 border-blue-600" 
                        : "border-transparent hover:bg-gray-100"
                    }`}
                  >
                    <div className="relative">
                      {contact.avatar_url ? (
                        <img src={contact.avatar_url} alt={contact.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {contact.role && (
                         <div className="absolute -bottom-1 -right-1 bg-white p-[2px] rounded-full">
                            <div className={`w-3.5 h-3.5 rounded-full ${contact.role === 'admin' ? 'bg-red-500' : contact.role === 'author' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                         </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-1 overflow-hidden">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`font-semibold truncate ${selectedContact?.id === contact.id ? "text-blue-800" : "text-gray-800"}`}>
                          {contact.name}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {contact.role === 'admin' ? 'Admin' : contact.role === 'author' ? 'Author' : 'User'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm truncate ${contact.unread_count > 0 ? "font-medium text-gray-800" : "text-gray-500"}`}>
                          {contact.unread_count > 0 ? "New message received" : "Click to view messages"}
                        </p>
                        {contact.unread_count > 0 && (
                          <div className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                            {contact.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                No contacts found
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#F8FAFC]">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center">
                  <div className="relative">
                    {selectedContact.avatar_url ? (
                      <img src={selectedContact.avatar_url} alt={selectedContact.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
                        {selectedContact.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-800">{selectedContact.name}</h3>
                    <p className="text-xs text-green-500 font-medium">Online</p>
                  </div>
                </div>
                
                <div className="flex gap-4 text-gray-400">
                  <button className="hover:text-blue-600 transition"><Phone size={20} /></button>
                  <button className="hover:text-blue-600 transition"><Video size={20} /></button>
                  <button onClick={handleDeleteConversation} className="hover:text-red-500 transition" title="Delete Conversation">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex justify-center">
                  <span className="bg-white px-4 py-1 rounded-full text-xs font-medium text-gray-400 shadow-sm border border-gray-100">
                    Today
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                      <Send className="text-blue-300 w-8 h-8" />
                    </div>
                    <p>No messages yet. Send a message to start chatting!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.sender_id === user?.id;
                    const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
                    
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && showAvatar && (
                          <div className="mr-3 flex-shrink-0 mt-auto">
                            {selectedContact.avatar_url ? (
                              <img src={selectedContact.avatar_url} alt="avatar" className="w-8 h-8 rounded-full shadow-sm" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {selectedContact.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!isMe && !showAvatar && <div className="w-11"></div>}

                        <div className={`max-w-[70%] ${isMe ? 'order-1' : 'order-2'}`}>
                          <div 
                            className={`px-5 py-3 shadow-sm relative group ${
                              isMe 
                                ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                                : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                            }`}
                          >
                            {editingMessageId === msg.id ? (
                              <div className="flex flex-col gap-2">
                                <input 
                                  type="text"
                                  className="w-full bg-blue-700 text-white border-none focus:outline-none rounded p-1"
                                  value={editedText}
                                  onChange={(e) => setEditedText(e.target.value)}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateMessage(msg.id);
                                    if (e.key === 'Escape') setEditingMessageId(null);
                                  }}
                                />
                                <div className="flex gap-2 text-xs">
                                  <button onClick={() => handleUpdateMessage(msg.id)} className="bg-white text-blue-600 px-2 py-1 rounded">Save</button>
                                  <button onClick={() => setEditingMessageId(null)} className="bg-blue-500 text-white px-2 py-1 rounded">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                            )}
                            
                            {isMe && editingMessageId !== msg.id && (
                              <div className="hidden group-hover:block absolute top-0 right-[calc(100%+8px)] w-48 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden text-sm text-gray-700 z-50">
                                <div className="px-4 py-3 text-xs text-gray-400 border-b border-gray-50 flex justify-center bg-gray-50/50">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </div>
                                
                                <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between transition-colors">
                                  <span className="font-medium">Reply</span>
                                  <Reply className="w-4 h-4 text-gray-600" />
                                </button>
                                
                                <button 
                                  onClick={() => {
                                    setEditingMessageId(msg.id);
                                    setEditedText(msg.message);
                                  }} 
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between transition-colors"
                                >
                                  <span className="font-medium">Edit</span>
                                  <Edit2 className="w-4 h-4 text-gray-600" />
                                </button>
                                
                                <button 
                                  onClick={() => navigator.clipboard.writeText(msg.message)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between transition-colors"
                                >
                                  <span className="font-medium">Copy</span>
                                  <Copy className="w-4 h-4 text-gray-600" />
                                </button>

                                <button 
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-500 flex items-center justify-between transition-colors border-t border-gray-50"
                                >
                                  <span className="font-medium">Unsend</span>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className={`flex items-center mt-1 space-x-1 ${isMe ? 'justify-end' : 'justify-start'} text-xs text-gray-400`}>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                            {isMe && (
                              msg.is_read ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <button type="button" className="text-gray-400 hover:text-blue-600 transition p-2 bg-gray-50 rounded-full">
                    <Smile size={20} />
                  </button>
                  <button type="button" className="text-gray-400 hover:text-blue-600 transition p-2 bg-gray-50 rounded-full">
                    <Paperclip size={20} />
                  </button>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                       <button type="button" className="text-gray-400 hover:text-blue-600 transition">
                          <ImageIcon size={18} />
                       </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <Send size={18} className={newMessage.trim() ? "ml-1" : ""} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
              <div className="w-32 h-32 mb-6 opacity-20">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                 </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Welcome to Messages</h2>
              <p className="text-gray-500 max-w-sm text-center">Select a conversation from the sidebar to start chatting with admins, authors, and users.</p>
            </div>
          )}
        </div>
      </div>
    </React.Suspense>
  );
}
