import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Calendar, 
  User, 
  MapPin, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  ChevronRight, 
  Filter, 
  Search, 
  MoreVertical,
  Activity,
  CreditCard,
  Phone,
  Mail,
  X,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Undo2,
  Wallet,
  ChevronLeft,
  Ban,
  Trash2
} from "lucide-react";
import api from "../api";
import BookingChatAdmin from "../components/BookingChatAdmin";

import { useSocket } from "../context/SocketContext";

const Bookings = () => {
    const { on } = useSocket();
    const location = useLocation();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showDetails, setShowDetails] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(12);

    useEffect(() => {
        if (location.state?.bookingId) {
            const targetId = location.state.bookingId;
            navigate(location.pathname, { replace: true, state: {} });

            const selectTarget = async () => {
                const found = bookings.find(b => b._id === targetId);
                if (found) {
                    setSelectedBooking(found);
                    setShowDetails(true);
                } else {
                    try {
                        setLoading(true);
                        const res = await api.get("/v1/admin/bookings?all=true");
                        if (res.data?.success) {
                            const booking = res.data.bookings.find(b => b._id === targetId);
                            if (booking) {
                                setBookings(prev => [booking, ...prev.filter(b => b._id !== targetId)]);
                                setSelectedBooking(booking);
                                setShowDetails(true);
                            }
                        }
                    } catch (err) {
                        console.error("Failed to load booking from notification state", err);
                    } finally {
                        setLoading(false);
                    }
                }
            };

            if (!loading) {
                selectTarget();
            }
        }
    }, [location.state, bookings, loading, navigate, location.pathname]);

    useEffect(() => {
        fetchBookings(page);
        
        // Setup real-time listeners
        const refresh = () => fetchBookings(page);
        const unsubAdd = on("jobAdded", refresh);
        const unsubUpd = on("jobUpdated", refresh);
        const unsubRef = on("wallet_updated", refresh);
        
        return () => {
          unsubAdd();
          unsubUpd();
          unsubRef();
        };
    }, [statusFilter, on, page]); // Depend on filter, socket listener and page

    const fetchBookings = async (pageNum = 1) => {
        try {
            setLoading(true);
            const res = await api.get(`/v1/admin/bookings?page=${pageNum}&limit=${limit}&status=${statusFilter}`);
            if (res.data?.success) {
                setBookings(res.data.bookings);
                setTotalPages(res.data.pagination?.pages || 1);
                setPage(res.data.pagination?.page || 1);
            }
        } catch (err) {
            console.error("Failed to fetch bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm("CRITICAL: Are you sure you want to cancel and refuse this engagement? This will terminate the booking cycle.")) return;
        
        try {
            setLoading(true);
            const res = await api.post(`/v1/admin/bookings/${bookingId}/cancel`, {
                reason: "Administrative Intervention - Refused by Admin"
            });
            
            if (res.data?.success) {
                alert("Booking Cancelled and Refused Successfully.");
                fetchBookings();
                setShowDetails(false);
            }
        } catch (err) {
            console.error("Cancellation failed:", err);
            alert(err.response?.data?.error || "Failed to cancel booking. Ensure you have administrative clearance.");
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async (bookingId) => {
        if (!window.confirm("Are you sure you want to refund this booking amount to the customer's wallet?")) return;
        
        try {
            setLoading(true);
            const res = await api.post(`/v1/admin/bookings/${bookingId}/refund`, {
                reason: "Provider Unavailable / Admin Correction"
            });
            
            if (res.data?.success) {
                alert(res.data.message);
                fetchBookings();
                setShowDetails(false);
            }
        } catch (err) {
            console.error("Refund failed:", err);
            alert(err.response?.data?.error || "Failed to process refund. Ensure a token payment exists.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'accepted': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'in-progress': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
            case 'cancelled': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            case 'no_provider_found': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch = 
            b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b._id.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || b.status?.toLowerCase() === statusFilter.toLowerCase();
        
        return matchesSearch && matchesStatus;
    });

    const handleSelectBooking = (booking) => {
        setSelectedBooking(booking);
        setShowDetails(true);
    };

    if (loading && bookings.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-black uppercase text-gray-400 tracking-widest">Compiling Records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Booking Command Center</h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Platform-wide operation monitoring and auditing</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Trace reference or client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:min-w-[280px] pl-10 pr-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium dark:text-white" 
                        />
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar bg-white dark:bg-gray-950 p-1 rounded-xl border border-gray-100 dark:border-gray-800 w-full sm:w-auto">
                        {['all', 'pending', 'accepted', 'completed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main view grid */}
            <div className={`grid grid-cols-1 ${showDetails ? "lg:grid-cols-2" : "lg:grid-cols-3"} gap-8 transition-all duration-500`}>
                
                {/* List portion */}
                <div className={`${showDetails ? "lg:col-span-1" : "lg:col-span-3"} space-y-4`}>
                    <div className={`grid grid-cols-1 ${showDetails ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3"} gap-6`}>
                        {filteredBookings.map((b) => (
                            <div 
                                key={b._id}
                                onClick={() => handleSelectBooking(b)}
                                className={`group bg-white dark:bg-gray-950 p-5 rounded-2xl border ${selectedBooking?._id === b._id ? 'border-blue-500 bg-blue-50/10 shadow-lg' : 'border-gray-100 dark:border-gray-800 shadow-sm'} hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 relative overflow-hidden`}
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors uppercase">
                                            {b.serviceName?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 group-hover:text-blue-600 transition-colors">Booking Ref</h3>
                                            <p className="text-gray-900 dark:text-white font-black text-sm uppercase">#{b._id.slice(-6)}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(b.status)}`}>
                                        {b.status}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <User size={14} className="text-blue-500" />
                                        <span className="text-xs font-bold truncate">{b.customerName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Calendar size={14} className="text-blue-500" />
                                        <span className="text-xs font-bold">{new Date(b.date).toLocaleDateString()} at {b.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <TrendingUp size={14} className="text-emerald-500" />
                                        <span className="text-xs font-bold italic">Value: ₹{b.totalPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <MapPin size={12} className="text-rose-500 shrink-0" />
                                        <span className="text-[10px] font-bold italic truncate">
                                          {b.houseNo && `${b.houseNo}, `}{b.colony || b.city || 'Location'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800/50">
                                    <div className="flex -space-x-2">
                                        {/* Just for visualization */}
                                        <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white dark:border-gray-950 flex items-center justify-center"><User size={10} className="text-white"/></div>
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-950 flex items-center justify-center"><CheckCircle size={10} className="text-white"/></div>
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        Vitals <ChevronRight size={14}/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {bookings.length > 0 && (
                        <div className="flex items-center justify-center gap-4 mt-12 pb-10">
                            <button 
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1 || loading}
                                className="p-3 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-700 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            
                            <div className="flex items-center gap-2">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    if (
                                        totalPages <= 5 ||
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        Math.abs(pageNum - page) <= 1
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-10 h-10 rounded-xl text-[10px] font-black uppercase transition-all ${
                                                    page === pageNum 
                                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-600/20" 
                                                        : "bg-white dark:bg-gray-950 text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-blue-400 border border-gray-100 dark:border-gray-800 shadow-sm"
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (
                                        (pageNum === 2 && page > 3) ||
                                        (pageNum === totalPages - 1 && page < totalPages - 2)
                                    ) {
                                        return <span key={pageNum} className="text-gray-400 text-[10px] font-black mx-1">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button 
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages || totalPages === 0 || loading}
                                className="p-3 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-700 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Details portion */}
                {showDetails && selectedBooking && (
                    <div className="space-y-6 lg:sticky lg:top-6 h-fit animate-in slide-in-from-right-10 duration-500">
                        {/* Summary & Actions Card */}
                        <div className="bg-white dark:bg-gray-950 p-0 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={() => setShowDetails(false)} className="p-2 bg-gray-100 dark:bg-gray-900 rounded-full hover:bg-rose-500 hover:text-white transition-all text-gray-400">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Banner strip */}
                            <div className="h-2 bg-blue-600 w-full" />

                            <div className="p-8">
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ShieldCheck className="text-blue-600" size={24} />
                                        <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">Active Engagement Detail</h2>
                                    </div>
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest pl-9">System Audit for Reference #{selectedBooking._id}</p>
                                </div>

                                {/* Participants */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">CLIENT_DATA</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white dark:bg-gray-950 rounded-lg flex items-center justify-center text-blue-600 border border-blue-500/20 shadow-sm">
                                                <User size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-gray-900 dark:text-white truncate uppercase">{selectedBooking.userId?.fullName || selectedBooking.customerName}</p>
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase truncate">
                                                    <Phone size={10} /> 
                                                    {selectedBooking.userId?.phoneNumber || "NO_DATA"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">PROVIDER_DATA</span>
                                        <div className="flex items-center gap-3">
                                            {selectedBooking.providerId ? (
                                                <>
                                                    <div className="w-10 h-10 bg-white dark:bg-gray-950 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-500/20 shadow-sm overflow-hidden">
                                                        {selectedBooking.providerId.profilePhoto ? (
                                                            <img 
                                                                src={selectedBooking.providerId.profilePhoto.startsWith('http') 
                                                                    ? selectedBooking.providerId.profilePhoto 
                                                                    : `${import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"}/uploads/${selectedBooking.providerId.profilePhoto}`} 
                                                                className="w-full h-full object-cover" 
                                                                alt={selectedBooking.providerId.fullName}
                                                            />
                                                        ) : <Activity size={18} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black text-gray-900 dark:text-white truncate uppercase">{selectedBooking.providerId.fullName}</p>
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase truncate">
                                                            <Phone size={10} /> 
                                                            {selectedBooking.providerId.phoneNumber}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2 opacity-30">
                                                    <AlertCircle size={14} />
                                                    <span className="text-xs font-black uppercase italic tracking-tighter">Awaiting Assignment</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Booking details grid */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-800/50">
                                        <span className="text-xs font-black text-gray-400 uppercase">Service Category</span>
                                        <span className="text-sm font-black uppercase text-gray-900 dark:text-white">{selectedBooking.serviceType}</span>
                                    </div>
                                    <div className="flex justify-between items-start py-3 border-b border-gray-50 dark:border-gray-800/50">
                                        <span className="text-xs font-black text-gray-400 uppercase mt-1">Deployment Spot</span>
                                        <div className="text-right max-w-[250px]">
                                            <span className="text-sm font-black uppercase text-gray-900 dark:text-white flex items-center justify-end gap-1">
                                                <MapPin size={14} className="text-rose-500" />
                                                {selectedBooking.city}
                                            </span>
                                            <p className="text-xs font-black text-blue-600 uppercase italic mt-1">
                                              {selectedBooking.houseNo && `${selectedBooking.houseNo}, `}{selectedBooking.flatNo && `${selectedBooking.flatNo}, `}{selectedBooking.colony}
                                            </p>
                                            {selectedBooking.landMark && (
                                              <p className="text-[10px] font-bold text-orange-500 uppercase mt-0.5 italic">Landmark: {selectedBooking.landMark}</p>
                                            )}
                                            <p className="text-[9px] font-bold text-gray-400 mt-1 italic leading-tight">{selectedBooking.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-800/50">
                                        <span className="text-xs font-black text-gray-400 uppercase">Schedule Window</span>
                                        <div className="text-right">
                                            <span className="text-sm font-black uppercase text-gray-900 dark:text-white">{new Date(selectedBooking.date).toDateString()}</span>
                                            <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-widest">{selectedBooking.time}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-xs font-black text-gray-400 uppercase">Financial Payload</span>
                                        <div className="text-right">
                                            <span className="text-lg font-black text-emerald-600">₹{selectedBooking.price.toLocaleString()}</span>
                                            <p className="text-[10px] font-black text-emerald-500/50 uppercase italic">Cleared via Platform</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Refund Details if Cancelled */}
                                {selectedBooking.status?.toLowerCase() === 'cancelled' && selectedBooking.refundAmount !== undefined && (
                                    <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                                            <AlertCircle size={14} /> CANCELLATION_REFUND_DATA
                                        </span>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Refund Amount</span>
                                            <span className="text-xs font-black text-rose-600 dark:text-rose-400 italic">₹{selectedBooking.refundAmount}</span>
                                        </div>
                                        {selectedBooking.cancellationFee !== undefined && (
                                            <div className="flex justify-between items-center py-1">
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Cancellation Fee</span>
                                                <span className="text-xs font-black text-gray-900 dark:text-white italic">₹{selectedBooking.cancellationFee}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Refund Status</span>
                                            <span className="text-xs font-black text-rose-600 dark:text-rose-400 italic">{selectedBooking.refundStatus || "Refunded"}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Add On Section if any */}
                                {selectedBooking.addOns && selectedBooking.addOns.length > 0 && (
                                    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">ADDITIONAL_MODULES</span>
                                        {selectedBooking.addOns.map((add, i) => (
                                            <div key={i} className="flex justify-between items-center py-1">
                                                <span className="text-xs font-bold text-gray-600 uppercase">{add.name}</span>
                                                <span className="text-xs font-black text-gray-900 dark:text-white italic">₹{add.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {["paid", "accepted", "pending", "confirmed", "cancelled", "no_provider_found"].includes(selectedBooking.status?.toLowerCase()) && (
                                    <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                                        {["paid", "accepted", "pending", "confirmed"].includes(selectedBooking.status?.toLowerCase()) && (
                                            <button 
                                                onClick={() => handleCancelBooking(selectedBooking._id)}
                                                className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 dark:bg-black hover:bg-rose-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 border border-white/5"
                                            >
                                                <Ban size={16} /> Cancel & Refuse Engagement
                                            </button>
                                        )}

                                        {["paid", "accepted", "cancelled", "no_provider_found"].includes(selectedBooking.status?.toLowerCase()) && 
                                         !(selectedBooking.service?.requestId || selectedBooking.service?.category === "Digital Work" || selectedBooking.serviceType?.toLowerCase().includes("digital")) && (
                                            <button 
                                                onClick={() => handleRefund(selectedBooking._id)}
                                                className="w-full flex items-center justify-center gap-2 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 active:scale-95 transition-all"
                                            >
                                                <RotateCcw size={16} /> Refund Token to Wallet
                                            </button>
                                        )}
                                        <p className="text-[10px] text-center font-black text-gray-400 uppercase tracking-widest mt-4 italic opacity-50">
                                            Admin Authorization Required for Cancellation or Reversals
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chat Intercept Component */}
                        <BookingChatAdmin 
                            bookingId={selectedBooking._id} 
                            customerId={selectedBooking.userId?._id || selectedBooking.userId}
                            providerId={selectedBooking.providerId?._id || selectedBooking.providerId}
                            customerName={selectedBooking.customerName}
                            providerName={selectedBooking.providerName}
                        />
                    </div>
                )}

            </div>
        </div>
    );
};

export default Bookings;
