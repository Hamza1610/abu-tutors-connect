'use client';

import React, { useState, useEffect, useRef } from 'react';
import { messageApi, userApi } from '../../services/api';
import { getImageUrl } from '../../utils/image';
import { useRouter } from 'next/navigation';
import { getSocket } from '../../utils/socket';

export default function MessagesPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedPartner, setSelectedPartner] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, convRes] = await Promise.all([
                    userApi.getProfile(),
                    messageApi.getChatList()
                ]);
                setUser(userRes.data);
                setConversations(convRes.data);

                // Handle partnerId from URL
                const params = new URLSearchParams(window.location.search);
                const partnerId = params.get('partnerId');
                if (partnerId) {
                    const existing = convRes.data.find((c: any) => c.partner._id === partnerId);
                    if (existing) {
                        setSelectedPartner(existing.partner);
                    } else {
                        // Start new conversation by fetching partner profile
                        try {
                            const pRes = await userApi.getUserPublicProfile(partnerId);
                            setSelectedPartner(pRes.data);
                        } catch (err) {
                            console.error("Partner not found");
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch messages data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedPartner) {
            const fetchConv = async () => {
                try {
                    const res = await messageApi.getConversation(selectedPartner._id);
                    setMessages(res.data);
                } catch (err) {
                    console.error("Failed to fetch conversation", err);
                }
            };
            fetchConv();
        }
    }, [selectedPartner]);

    // NEW: Real-time Socket Listener
    useEffect(() => {
        if (!user) return;
        const socket = getSocket(user._id);
        if (!socket) return;

        const handleNewMessage = (msg: any) => {
            // Update conversation list
            setConversations(prev => {
                const partnerId = msg.senderId === user._id ? msg.receiverId : msg.senderId;
                const existing = prev.find(c => c.partner._id === partnerId);
                if (existing) {
                    return prev.map(c => c.partner._id === partnerId 
                        ? { ...c, lastMessage: msg } 
                        : c
                    );
                }
                return prev; // Or re-fetch if new conversation
            });

            // Update current message list if msg belongs to selected partner
            if (selectedPartner && (msg.senderId === selectedPartner._id || msg.receiverId === selectedPartner._id)) {
                setMessages(prev => {
                    const alreadyExists = prev.some(m => m._id === msg._id);
                    return alreadyExists ? prev : [...prev, msg];
                });
            }
        };

        const handleMsgRead = (data: any) => {
            if (selectedPartner && data.partnerId === selectedPartner._id) {
                setMessages(prev => prev.map(m => 
                    m.senderId === user._id ? { ...m, isRead: true } : m
                ));
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('msg_read', handleMsgRead);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('msg_read', handleMsgRead);
        };
    }, [user, selectedPartner]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedPartner || sending) return;

        setSending(true);
        try {
            const res = await messageApi.sendMessage({
                receiverId: selectedPartner._id,
                content: newMessage
            });
            setMessages([...messages, res.data]);
            setNewMessage('');
            
            // Update conversation list with latest message
            const updatedConv = await messageApi.getChatList();
            setConversations(updatedConv.data);
        } catch (err) {
            alert("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="container pt-space-8 text-center">Loading Messages...</div>;

    return (
        <main className="container pb-space-8 pt-space-8" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div className="card" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: '500px' }}>
                {/* Conversations Sidebar */}
                <div style={{ width: '300px', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', fontWeight: 'bold' }}>Conversations</div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {conversations.length > 0 ? conversations.map((conv: any) => (
                            <div 
                                key={conv.partner._id} 
                                onClick={() => setSelectedPartner(conv.partner)}
                                style={{ 
                                    padding: '15px 20px', 
                                    cursor: 'pointer', 
                                    borderBottom: '1px solid #F1F5F9',
                                    backgroundColor: selectedPartner?._id === conv.partner._id ? '#F1F5F9' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                            >
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E2E8F0', overflow: 'hidden' }}>
                                    {conv.partner.documents?.profilePicture ? (
                                        <img src={getImageUrl(conv.partner.documents?.profilePicture)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: '#64748B' }}>{conv.partner.name.charAt(0)}</div>
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.partner.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.lastMessage.content}</div>
                                </div>
                                {!conv.lastMessage.isRead && conv.lastMessage.receiverId === user._id && (
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>
                                )}
                            </div>
                        )) : (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>No conversations yet.</div>
                        )}
                    </div>
                </div>

                {/* Chat Window */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
                    {selectedPartner ? (
                        <>
                            <div style={{ padding: '15px 20px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ fontWeight: 'bold' }}>{selectedPartner.name}</div>
                                <span className="tutor-card__badge" style={{ fontSize: '10px' }}>{selectedPartner.role}</span>
                            </div>
                            
                            <div ref={scrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {messages.map((msg: any) => (
                                    <div 
                                        key={msg._id} 
                                        style={{ 
                                            alignSelf: msg.senderId === user._id ? 'flex-end' : 'flex-start',
                                            maxWidth: '70%',
                                            padding: '10px 15px',
                                            borderRadius: msg.senderId === user._id ? '15px 15px 2px 15px' : '15px 15px 15px 2px',
                                            backgroundColor: msg.senderId === user._id ? 'var(--color-primary)' : 'white',
                                            color: msg.senderId === user._id ? 'white' : 'black',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {msg.content}
                                        <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {msg.senderId === user._id && (
                                                <span style={{ color: msg.isRead ? '#3B82F6' : 'white', fontWeight: 'bold' }}>
                                                    {msg.isRead ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleSendMessage} style={{ padding: '20px', backgroundColor: 'white', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    placeholder="Type your message..." 
                                    className="form-input" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    style={{ margin: 0 }}
                                />
                                <button type="submit" className="btn btn--primary" disabled={!newMessage.trim() || sending}>Send</button>
                            </form>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                            Select a conversation to start chatting
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
