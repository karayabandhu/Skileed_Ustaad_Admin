import React, { useState, useEffect } from "react";
import { 
  Bell, Clock, CheckCircle, Trash2, 
  Filter, Calendar, ChevronRight, ChevronLeft,
  ShieldCheck, AlertTriangle, Info,
  Briefcase, Users, Plus, DollarSign,
  Search, RefreshCw, Settings, Trash,
  Settings2, Smartphone, Monitor,
  Settings as SettingsIcon, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(5);

  const fetchNotifications = async (pageNumber = 1, currentFilter = filter, currentSearch = search) => {
    try {
      setLoading(true);
      const res = await api.get(`/notifications/list?page=${pageNumber}&limit=${limit}&filter=${currentFilter}&search=${currentSearch}`);
      if (res.data?.success) {
        setNotifications(res.data.notifications);
        setTotalPages(res.data.pagination.pages);
        setTotalItems(res.data.pagination.total);
        setPage(res.data.pagination.page);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Immediate fetch on page or filter change
  useEffect(() => {
    fetchNotifications(page, filter, search);
  }, [page, filter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
       if (page !== 1) {
         setPage(1);
       } else {
         fetchNotifications(1, filter, search);
       }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      fetchNotifications();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_booking': return <Briefcase size={20} className="text-blue-500" />;
      case 'new_provider': return <Users size={20} className="text-emerald-500" />;
      case 'new_customer': return <Plus size={20} className="text-purple-500" />;
      case 'new_user': return <Plus size={20} className="text-purple-500" />;
      case 'payout_request': return <DollarSign size={20} className="text-amber-500" />;
      case 'system_alert': return <ShieldCheck size={20} className="text-rose-500" />;
      case 'booking_cancelled': return <AlertTriangle size={20} className="text-rose-500" />;
      default: return <Bell size={20} className="text-gray-400" />;
    }
  };

  // Using notifications directly since filtering is now server-side
  const displayNotifs = notifications;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-2 sm:p-4">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-600 shadow-lg shadow-blue-500/20 text-white rounded-2xl">
                <Bell size={24} />
             </div>
             <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic font-serif">
               Activity <span className="text-blue-500 italic">Logs</span>
             </h2>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">Central Intelligence Feed & Security Logs</p>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => navigate("/notification/settings")}
             className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
           >
              <SettingsIcon size={14} /> Dispatch Settings
           </button>
           <button 
             onClick={markAllAsRead}
             className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
           >
              <CheckCircle size={14} /> Mark Read
           </button>
           <button 
             onClick={fetchNotifications}
             className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-500 hover:text-blue-500 transition-all shadow-sm"
           >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
           </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-[#0f172a] p-4 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-2xl w-full md:w-fit">
            <button 
              onClick={() => setFilter("all")}
              className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === "all" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xl" : "text-gray-400"}`}
            >All Activity</button>
            <button 
              onClick={() => setFilter("unread")}
              className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === "unread" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xl" : "text-gray-400"}`}
            >Unread Logs</button>
         </div>

         <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Search intelligence cache..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-blue-500/50 rounded-2xl text-xs font-bold text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-500"
            />
         </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-30 gap-4">
             <RefreshCw className="animate-spin text-blue-500" size={40} />
             <p className="text-[10px] font-black uppercase tracking-widest leading-none">Scanning Data Blocks...</p>
          </div>
        ) : displayNotifs.length === 0 ? (
          <div className="py-32 bg-white dark:bg-[#0f172a] rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center px-10 gap-4">
             <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-full text-gray-300">
                <Bell size={48} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Silent Frequency</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">No operational notifications detected in this cluster.</p>
             </div>
          </div>
        ) : (
          displayNotifs.map((n) => {
            const handleNotificationClick = (n) => {
              const type = n.type?.toLowerCase() || "";
              const title = n.title?.toLowerCase() || "";
              const message = n.message?.toLowerCase() || "";
              const metadata = n.metadata || {};

              if (type.includes("booking") || title.includes("booking") || message.includes("booking") || type.includes("refund")) {
                navigate("/bookings", { state: { bookingId: metadata.bookingId } });
              } else if (type.includes("user") || title.includes("customer") || type.includes("customer")) {
                navigate("/users", { state: { userId: metadata.userId } });
              } else if (type.includes("provider") || title.includes("provider")) {
                navigate("/providers", { state: { providerId: metadata.providerId } });
              } else if (type.includes("payout") || title.includes("payout")) {
                navigate("/payouts", { state: { payoutId: metadata.payoutId } });
              } else if (type.includes("chat") || title.includes("chat")) {
                navigate("/support");
              } else {
                // Stay on notifications if unknown
              }
            };

            return (
              <div 
                key={n._id} 
                onClick={() => handleNotificationClick(n)}
                className={`group bg-white dark:bg-[#0f172a] p-6 rounded-[2.5rem] border transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center cursor-pointer hover:shadow-2xl hover:bg-gray-50/50 dark:hover:bg-white/[0.02] ${!n.isRead ? "border-blue-500/30 shadow-lg shadow-blue-500/5" : "border-gray-100 dark:border-white/10"}`}
              >
                 {!n.isRead && (
                   <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                 )}
                 
                 <div className={`p-5 rounded-3xl shrink-0 transition-transform group-hover:scale-110 ${
                   n.type === 'new_booking' ? 'bg-blue-600/10' :
                   n.type === 'new_provider' ? 'bg-emerald-600/10' :
                   n.type === 'new_customer' ? 'bg-purple-600/10' :
                   n.type === 'payout_request' ? 'bg-amber-600/10' :
                   'bg-rose-600/10'
                 }`}>
                    {getIcon(n.type)}
                 </div>

                 <div className="flex-1 space-y-2 text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                       <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{new Date(n.createdAt).toLocaleString()}</span>
                       <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-white/10" />
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Node: {n.type || "System Alert"}</span>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight italic truncate">{n.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed italic border-l-2 border-gray-100 dark:border-white/5 pl-4 line-clamp-2 md:line-clamp-none">"{n.message}"</p>
                 </div>

                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-white/5 text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-600/10 rounded-2xl transition-all border border-transparent group-hover:border-blue-500/20">
                       <ChevronRight size={20} />
                    </div>
                 </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
       {displayNotifs.length > 0 && (
         <div className="flex items-center justify-center gap-4 mt-8 pb-10">
           <button 
             onClick={() => setPage(prev => Math.max(prev - 1, 1))}
             disabled={page === 1 || loading}
             className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-700 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
           >
             <ChevronLeft size={20} />
           </button>
           
           <div className="flex items-center gap-2">
             {totalPages > 0 && [...Array(totalPages)].map((_, i) => {
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
                     className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                       page === pageNum 
                         ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-600/20" 
                         : "bg-white dark:bg-white/5 text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-blue-400 border border-gray-200 dark:border-white/10"
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
             className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-700 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
           >
             <ChevronRight size={20} />
           </button>
         </div>
       )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 rounded-[3rem]">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
                <Info size={24} />
             </div>
             <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Security Retention Policy</p>
                <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">System logs are purged after 90 solar days.</p>
             </div>
          </div>
          <button className="w-full md:w-fit px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-xl">
             <Trash size={18} /> Purge Trace Logs
          </button>
      </div>
    </div>
  );
};

export default Notifications;
