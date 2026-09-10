import React, { useState, useEffect, useRef } from "react";
import { Send, User, Bot, Clock, MessageSquare, X, Loader2, ShieldCheck } from "lucide-react";
import api from "../api";
import { useSocket } from "../context/SocketContext";

/**
 * Admin component to monitor and intervene in booking-specific chats.
 */
const BookingChatAdmin = ({ bookingId, customerId, providerId, customerName, providerName }) => {
    const { socket, on, emit, isConnected } = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!bookingId || !socket) return;

        // Fetch History
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/v1/chat/${bookingId}`);
                setMessages(res.data || []);
            } catch (err) {
                console.error("Failed to load chat history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

        // Socket logic using context listeners
        const unsubMsg = on("new_message", (msg) => {
            if (msg.bookingId === bookingId) {
                setMessages((prev) => [...prev, msg]);
            }
        });

        // Join the booking room
        emit("join_chat", { bookingId });

        return () => {
            unsubMsg();
            emit("leave_chat", { bookingId });
        };
    }, [bookingId, on, emit, socket]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !bookingId) return;

        try {
            // As an admin, you can choose who to send to, or just broadcast.
            // Let's send to the provider by default or user if provider not assigned.
            const receiverId = providerId || customerId; 
            
            const payload = {
                bookingId,
                content: input,
                receiverId
            };

            const res = await api.post("/v1/chat/send", payload);
            // Local update (optional since backend broadcasts)
            // setMessages(prev => [...prev, res.data]); 
            setInput("");
        } catch (err) {
            console.error("Admin failed to send message:", err);
            alert("Could not send admin message.");
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-blue-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <ShieldCheck className="text-white" size={18} />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-xs uppercase tracking-widest">Admin Monitoring Mode</h3>
                        <p className="text-blue-100 text-[10px] font-bold">Booking #{bookingId?.slice(-6).toUpperCase()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-rose-400"} animate-pulse`} />
                    <span className="text-white text-[10px] font-bold uppercase">{isConnected ? "Live" : "Offline"}</span>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
                        <Loader2 className="animate-spin text-blue-600" />
                        <span className="text-[10px] font-black uppercase text-gray-400">Loading Chat Vault...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                        <MessageSquare size={40} className="mb-2 text-gray-400" />
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Silence is Golden</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isAdmin = msg.senderRole === "admin";
                        const isProvider = msg.senderRole === "provider";
                        
                        return (
                            <div key={msg._id || i} className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${
                                    isAdmin 
                                        ? "bg-blue-600 text-white rounded-tl-none border border-blue-500" 
                                        : isProvider
                                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 rounded-tr-none border border-amber-200 dark:border-amber-800"
                                            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-tr-none border border-gray-100 dark:border-gray-700"
                                }`}>
                                    <p className="leading-relaxed">{msg.content}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1 px-1">
                                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">
                                        {msg.senderName || (isAdmin ? "Administrator" : isProvider ? "Provider" : "Customer")}
                                    </span>
                                    <span className="text-[9px] text-gray-300 font-medium italic">
                                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20 transition-all border border-transparent focus-within:border-blue-500/30 focus-within:bg-white dark:focus-within:bg-gray-950">
                    <input
                        type="text"
                        placeholder="Intervene as administrator..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-grow bg-transparent border-none outline-none px-3 text-sm dark:text-gray-100 placeholder:text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BookingChatAdmin;
