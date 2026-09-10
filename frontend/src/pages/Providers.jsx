import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import ConfirmModal from "../components/ConfirmModal";
import { 
  Search, Eye, X, User, ShieldCheck, ShieldAlert, 
  Clock, Star, MapPin, Phone, Mail, Globe, 
  Award, Briefcase, CreditCard, FileText, 
  ChevronRight, CheckCircle2, AlertCircle, Trash2,
  Image as ImageIcon, MoreHorizontal, Filter, Settings, Zap, Activity, RotateCcw
} from "lucide-react";
import axios from "axios";
import api from "../api";
import { useSocket } from "../context/SocketContext";

/**
 * Elite Provider Command Center
 * Orchestrates verification and management of service provider infrastructure
 */
const Providers = () => {
  const { on, emit } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [imageView, setImageView] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [globalSummary, setGlobalSummary] = useState({ total: 0, active: 0, suspended: 0, pending: 0 });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });

  useEffect(() => {
    if (location.state?.providerId) {
      const targetId = location.state.providerId;
      navigate(location.pathname, { replace: true, state: {} });

      const selectTarget = async () => {
        const found = providers.find(p => p._id === targetId);
        if (found) {
          setSelectedProvider(found);
        } else {
          try {
            setLoading(true);
            const res = await api.get("/providers?all=true");
            const raw = res.data?.providers || (Array.isArray(res.data) ? res.data : []);
            const normalized = raw.map((pr) => ({ ...pr, status: (pr.status || "pending").toString().toLowerCase() }));
            const provider = normalized.find(p => p._id === targetId);
            if (provider) {
              setProviders(prev => [provider, ...prev.filter(p => p._id !== targetId)]);
              setSelectedProvider(provider);
            }
          } catch (err) {
            console.error("Failed to load provider from notification state", err);
          } finally {
            setLoading(false);
          }
        }
      };

      if (!loading) {
        selectTarget();
      }
    }
  }, [location.state, providers, loading, navigate, location.pathname]);

  const fetchProviders = async (p = page) => {
    try {
      setLoading(true);
      const res = await api.get(`/providers?page=${p}`);
      const raw = res.data?.providers || (Array.isArray(res.data) ? res.data : []);
      const normalized = raw.map((pr) => ({ ...pr, status: (pr.status || "pending").toString().toLowerCase() }));
      setProviders(normalized);
      if (res.data?.pagination) {
        setTotalPages(res.data.pagination.pages);
      }
      if (res.data?.summary) {
        setGlobalSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Error fetching providers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();

    const unsubAdd = on("providerAdded", fetchProviders);
    const unsubUpd = on("providerUpdated", fetchProviders);
    const unsubSus = on("providerSuspended", fetchProviders);

    return () => {
      unsubAdd();
      unsubUpd();
      unsubSus();
    };
  }, [on]);

  const filtered = (Array.isArray(providers) ? providers : []).filter((p) => {
    const text = search.trim().toLowerCase();
    const matchText =
      p.fullName?.toLowerCase().includes(text) ||
      p.phoneNumber?.toLowerCase().includes(text) ||
      p.serviceCategory?.toLowerCase().includes(text) ||
      p.providerSubService?.toLowerCase().includes(text) ||
      p.subService?.toLowerCase().includes(text) ||
      p.email?.toLowerCase().includes(text);
    const matchesFilter = filter === "All" || p.status === filter.toString().toLowerCase();
    return matchText && matchesFilter;
  });

  const getStatusConfig = (s) => {
    const status = (s || "").toString().toLowerCase();
    switch (status) {
      case "active":
        return { 
          color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", 
          icon: <CheckCircle2 size={12} />,
          label: "Verified"
        };
      case "pending":
        return { 
          color: "bg-amber-500/10 text-amber-500 border-amber-500/20", 
          icon: <Clock size={12} />,
          label: "In Review"
        };
      case "suspended":
        return { 
          color: "bg-rose-500/10 text-rose-500 border-rose-500/20", 
          icon: <ShieldAlert size={12} />,
          label: "Halted"
        };
      default:
        return { 
          color: "bg-gray-500/10 text-gray-500 border-gray-500/20", 
          icon: <AlertCircle size={12} />,
          label: "Unknown"
        };
    }
  };

  const executeSuspend = async (id) => {
    try {
      setLoading(true);
      await api.put(`/providers/${id}`, { status: "Suspended" });
      fetchProviders();
      setSelectedProvider(null);
      emit("providerSuspended");
    } catch (err) {
      console.error("Error suspending provider:", err);
    } finally {
      setLoading(false);
    }
  };

  const suspendProvider = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Suspend Node?',
      message: 'Authorize permanent suspension of this node?',
      type: 'danger',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        executeSuspend(id);
      }
    });
  };

  const executeAccept = async (id) => {
    try {
      setLoading(true);
      await api.put(`/providers/${id}`, { status: "Active" });
      fetchProviders();
      setSelectedProvider(null);
      emit("providerUpdated");
    } catch (err) {
      console.error("Error accepting provider:", err);
      alert("Failed to accept provider node.");
    } finally {
      setLoading(false);
    }
  };

  const acceptProvider = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Accept Node?',
      message: 'Approve this provider node for active service?',
      type: 'warning',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        executeAccept(id);
      }
    });
  };

  const stats = [
    { 
      label: "Total Fleet Nodes", 
      value: globalSummary.total, 
      icon: <Globe size={20} />, 
      color: "text-blue-500", 
      bg: "bg-blue-600/10" 
    },
    { 
      label: "Active Protocols", 
      value: globalSummary.active, 
      icon: <CheckCircle2 size={20} />, 
      color: "text-emerald-500", 
      bg: "bg-emerald-600/10" 
    },
    { 
      label: "Halted / Offline", 
      value: globalSummary.suspended, 
      icon: <ShieldAlert size={20} />, 
      color: "text-rose-500", 
      bg: "bg-rose-600/10" 
    },
    { 
      label: "Onboarding Pulse", 
      value: globalSummary.pending, 
      icon: <Zap size={20} />, 
      color: "text-amber-500", 
      bg: "bg-amber-600/10" 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic font-serif">
            Provider <span className="text-blue-600 italic">Command</span>
          </h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">Orchestrating Service Infrastructure Nodes</p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-6 py-4 rounded-[2rem] shadow-sm backdrop-blur-xl">
           <Activity className="text-blue-500" size={18} />
           <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Global Sync Status</p>
              <p className="text-xs text-gray-900 dark:text-white font-black uppercase mt-1">Provider Core Live</p>
           </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => (
          <div key={index} className="group bg-white dark:bg-white/5 p-6 rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 flex items-center justify-between overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-2 h-full ${stat.color.replace('text', 'bg')}`}></div>
            <div className="space-y-1">
              <p className="text-[10px] text-gray-600 dark:text-gray-400 font-black uppercase tracking-[0.2em]">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter">{stat.value}</p>
            </div>
            <div className={`p-4 rounded-[1.5rem] ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-500`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-6 mb-8 bg-white dark:bg-white/5 p-4 rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-sm">
        <div className="relative flex-1 group w-full">
           <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
           <input 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             placeholder="Search fleet by name, category, or contact..."
             className="w-full bg-gray-50 dark:bg-black/20 border border-transparent focus:border-blue-500/50 rounded-2xl py-3.5 pl-16 pr-6 text-sm text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-500"
           />
        </div>

        <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/40 p-1.5 rounded-2xl border border-gray-200 dark:border-white/5 w-full lg:w-auto overflow-x-auto no-scrollbar">
           {["All", "Active", "Pending", "Suspended"].map((s) => (
             <button 
               key={s}
               onClick={() => setFilter(s)}
               className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                 filter === s 
                   ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                   : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
               }`}
             >
               {s}
             </button>
           ))}
        </div>
      </div>

      {/* Provider Grid */}
      <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stakeholder Details</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Service Domain</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Node</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sync Status</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Reputation</th>
                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtered.map((p) => {
                const config = getStatusConfig(p.status);
                return (
                  <tr key={p._id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-lg shadow-inner">
                          {p.fullName?.charAt(0) || <User size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none group-hover:text-blue-500 transition-colors uppercase">
                            {p.fullName || "Unregistered"}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">ID: {p._id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex flex-col gap-1">
                         <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest italic leading-none truncate max-w-[120px]">
                           {p.serviceCategory || "Generalist"}
                         </span>
                         {p.providerSubService && (
                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter truncate max-w-[120px] ml-1">
                               {p.providerSubService}
                            </span>
                         )}
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-300 flex items-center gap-2">
                             <Phone size={12} className="text-gray-400" /> {p.phoneNumber || "No Data"}
                          </p>
                           <p className="text-[10px] text-gray-500 font-bold flex items-center gap-2 uppercase italic tracking-widest">
                              <MapPin size={10} className="text-blue-500" /> {p.address?.colony || p.city || "Sector-Node General"}
                           </p>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest shadow-sm ${config.color}`}>
                          {config.icon} {config.label}
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-1.5 py-1 px-3 bg-amber-500/5 border border-amber-500/10 rounded-xl w-fit">
                          <Star size={12} className="text-amber-500 fill-amber-500" />
                          <span className="text-xs font-black text-amber-600">{p.rating ?? "0.0"}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center justify-center">
                          <button 
                            onClick={() => { setSelectedProvider(p); setActiveTab("personal"); }}
                            className="p-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/5 shadow-sm transition-all"
                          >
                             <Eye size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between">
             <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Fleet Page {page} / {totalPages}</p>
             </div>
             <div className="flex items-center gap-3">
                <button 
                  disabled={page === 1 || loading}
                  onClick={() => { setPage(p => p - 1); fetchProviders(page - 1); }}
                  className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-500 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-gray-100 transition-all shadow-sm"
                >
                   <ChevronRight size={18} className="rotate-180" />
                </button>
                <div className="flex gap-1.5">
                   {[...Array(totalPages)].map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => { setPage(i + 1); fetchProviders(i + 1); }}
                        className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${
                           page === i + 1 
                           ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30 active:scale-90" 
                           : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:border-blue-500/50"
                        }`}
                      >
                         {i + 1}
                      </button>
                   ))}
                </div>
                <button 
                  disabled={page === totalPages || loading}
                  onClick={() => { setPage(p => p + 1); fetchProviders(page + 1); }}
                  className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-500 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-gray-100 transition-all shadow-sm"
                >
                   <ChevronRight size={18} />
                </button>
             </div>
          </div>
        )}
      </div>

  {/* Detail Modal */}
  {selectedProvider && createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md" onClick={() => setSelectedProvider(null)}></div>
      
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-5xl h-[85vh] rounded-3xl md:rounded-[3.5rem] shadow-2xl border border-white/10 overflow-hidden relative z-10 flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-500">
            
            {/* Left Profile Sidebar */}
            <div className="w-full md:w-[24rem] bg-gray-50 dark:bg-white/[0.02] border-r border-gray-200 dark:border-white/5 flex flex-col">
               <div className="p-8 text-center flex-1">
                  <div className="relative inline-block mb-6">
                     <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] border-[6px] border-white dark:border-[#0f172a] shadow-2xl flex items-center justify-center text-4xl font-black text-white italic shadow-blue-600/20 overflow-hidden">
                        {selectedProvider.profilePhoto ? (
                             <img 
                                 src={selectedProvider.profilePhoto.startsWith('http') 
                                     ? selectedProvider.profilePhoto 
                                     : `${import.meta.env.VITE_SOCKET_URL || "http://200.234.47.38:5000"}/uploads/${selectedProvider.profilePhoto}`} 
                                 className="w-full h-full object-cover" 
                                 alt={selectedProvider.fullName}
                             />
                        ) : selectedProvider.fullName?.charAt(0)}
                     </div>
                     <div className={`absolute -bottom-2 -right-2 p-3 rounded-2xl border-[4px] border-white dark:border-[#0f172a] shadow-xl ${getStatusConfig(selectedProvider.status).color.split(' ')[0]} ${getStatusConfig(selectedProvider.status).color.split(' ')[1]}`}>
                        {getStatusConfig(selectedProvider.status).icon}
                     </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-none">{selectedProvider.fullName}</h3>
                  <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
                    {selectedProvider.serviceCategory || "Provider Node"}
                    {selectedProvider.providerSubService && ` • ${selectedProvider.providerSubService}`}
                  </p>
                  
                   <div className="grid grid-cols-4 gap-2 mt-8">
                      <div className="bg-white dark:bg-white/5 py-4 px-2 rounded-3xl border border-gray-200 dark:border-white/5">
                         <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight leading-none mb-2">Rating</p>
                         <p className="text-base font-black text-amber-500">⭐ {selectedProvider.rating ?? "0.0"}</p>
                      </div>
                      <div className="bg-white dark:bg-white/5 py-4 px-2 rounded-3xl border border-gray-200 dark:border-white/5">
                         <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight leading-none mb-2">Experience</p>
                         <p className="text-base font-black text-blue-500">{selectedProvider.experience || "0"}y</p>
                      </div>
                      <div className="bg-white dark:bg-white/5 py-4 px-2 rounded-3xl border border-gray-200 dark:border-white/5">
                         <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight leading-none mb-2">Jobs Done</p>
                         <p className="text-base font-black text-purple-500">{selectedProvider.jobs || "0"}</p>
                      </div>
                      <div className="bg-white dark:bg-white/5 py-4 px-2 rounded-3xl border border-gray-200 dark:border-white/5">
                         <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight leading-none mb-2">No-Show Strikes</p>
                         <p className="text-base font-black text-rose-500">{selectedProvider.noShowStrikes || "0"}/3</p>
                      </div>
                   </div>
                  <div className="mt-8 space-y-3">
                     <div className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 group transition-all">
                        <Phone size={18} className="text-blue-500" />
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{selectedProvider.phoneNumber}</p>
                     </div>
                     <div className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 group transition-all">
                        <MapPin size={18} className="text-emerald-500" />
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{selectedProvider.serviceArea || "Global"}</p>
                     </div>
                  </div>
               </div>

               {/* Footer Action */}
               <div className="p-8 bg-black/10">
                  <button 
                    onClick={() => setSelectedProvider(null)}
                    className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                     Close Intelligence Node
                  </button>
               </div>
            </div>

            {/* Right Data Grid */}
            <div className="flex-1 overflow-hidden flex flex-col">
               {/* Modal Navigation */}
               <div className="flex items-center gap-2 p-6 bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-white/5 overflow-x-auto no-scrollbar">
                  {[
                    { id: "personal", label: "Registry Data", icon: <FileText size={14} /> },
                    { id: "logistics", label: "Sector Logs", icon: <Globe size={14} /> },
                    { id: "financials", label: "Finance Hub", icon: <CreditCard size={14} /> },
                    { id: "verification", label: "Security Vault", icon: <Award size={14} /> },
                    { id: "preferences", label: "Preferences", icon: <Settings size={14} /> },
                  ].map((tab) => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                          : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
               </div>

               {/* Tab Content */}
               <div className="p-10 flex-1 overflow-y-auto space-y-10 no-scrollbar">
                  {activeTab === "personal" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Legal Full Name</label>
                             <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white uppercase">
                                {selectedProvider.fullName}
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Identity ID</label>
                             <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white font-mono uppercase tracking-tighter">
                                {selectedProvider._id}
                             </div>
                          </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Language Palette</label>
                              <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white italic capitalize">
                                 {selectedProvider.languageSpoken || "Multi-lingual Support"}
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Availability Status</label>
                              <div className={`p-6 rounded-[1.5rem] border text-sm font-bold uppercase ${selectedProvider.isAvailable ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100"}`}>
                                 {selectedProvider.isAvailable ? "Ready for Dispatch" : "Offline / Busy"}
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Registry Node Born</label>
                              <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white">
                                 {new Date(selectedProvider.createdAt).toLocaleString()}
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Last Sync Cycle</label>
                              <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white">
                                 {new Date(selectedProvider.updatedAt || selectedProvider.createdAt).toLocaleString()}
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {activeTab === "logistics" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Service Sector</label>
                             <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-black text-blue-500 uppercase italic">
                                {selectedProvider.serviceCategory || "N/A"}
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Expert Trade</label>
                             <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white uppercase transition-all">
                                {selectedProvider.providerSubService || "Generic"}
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Specific Task</label>
                             <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white uppercase transition-all">
                                {selectedProvider.subService || "Generalist"}
                             </div>
                          </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">City Hub</label>
                              <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white uppercase transition-all">
                                 {selectedProvider.city || "Not Registered"}
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Colony / Neighborhood</label>
                              <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white capitalize transition-all">
                                 {selectedProvider.address?.colony || "Sector-Node General"}
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">State Territory</label>
                              <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white uppercase transition-all">
                                 {selectedProvider.state || "National Area"}
                              </div>
                           </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Sub-Sector Focus</label>
                             <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white italic">
                                {selectedProvider.subService || "Specialized Expert"}
                             </div>
                          </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Pin-Code Hub</label>
                              <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white font-mono">
                                 {selectedProvider.pinCode || "Global"}
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Hub State</label>
                              <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white uppercase">
                                 {selectedProvider.state || "N/A"}
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Precise Coordinates</label>
                              <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white font-mono uppercase tracking-tighter">
                                 {selectedProvider.location?.coordinates?.join(", ") || "Geo-Lock Hidden"}
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {activeTab === "financials" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                       <div className="bg-emerald-500/5 border border-emerald-500/10 p-10 rounded-[2.5rem] space-y-6">
                          <h4 className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">Bank Settlement Ledger</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Primary Node Account</p>
                                 <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 italic tracking-tighter">
                                    {selectedProvider.bankAccountNumber || "NOT PROVISIONED"}
                                 </p>
                             </div>
                             <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">IFSC Routing Code</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter">
                                   {selectedProvider.ifscCode || "SECURE-NODE"}
                                 </p>
                             </div>
                              <div>
                                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Unified Payment (UPI)</p>
                                 <p className="text-lg font-bold text-emerald-500">
                                    {selectedProvider.upiId || "N/A"}
                                 </p>
                              </div>
                              <div>
                                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Account Holder</p>
                                 <p className="text-lg font-bold text-gray-900 dark:text-white uppercase">
                                    {selectedProvider.accountHolderName || "N/A"}
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {activeTab === "verification" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                       {[
                         { label: "Profile Blueprint", key: "profilePhoto" },
                         { label: "Sovereign identity", key: "governmentIDProof" },
                         { label: "Sector Residency", key: "addressProof" },
                         { label: "Competency Shield", key: "skillCertificate" },
                       ].map((doc) => (
                         <div key={doc.key} className="group relative bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-[2rem] hover:border-blue-500/30 transition-all flex items-center justify-between overflow-hidden">
                            <div className="space-y-1">
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">{doc.label}</p>
                               <p className="text-xs text-gray-400 font-medium italic mt-2 truncate max-w-[150px]">
                                  {selectedProvider[doc.key] || "Pending Upload"}
                               </p>
                            </div>
                            {selectedProvider[doc.key] ? (
                               <button 
                                 onClick={() => setImageView(selectedProvider[doc.key])}
                                 className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20 hover:scale-110 active:scale-95 transition-all"
                               >
                                  <ImageIcon size={18} />
                               </button>
                            ) : (
                               <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-500">
                                  <AlertCircle size={18} />
                               </div>
                            )}
                         </div>
                       ))}
                    </div>
                  )}

                  {activeTab === "preferences" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                       <div className="bg-blue-500/5 border border-blue-500/10 p-10 rounded-[2.5rem]">
                          <h4 className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Notification Ecosystem</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                             {Object.entries(selectedProvider.notificationPreferences || {}).map(([key, val]) => (
                               <div key={key} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 transition-all hover:bg-white/10">
                                  <div className={`h-2.5 w-2.5 rounded-full ${val ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" : "bg-rose-500 shadow-lg shadow-rose-500/50"}`}></div>
                                  <div className="flex-1">
                                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter italic leading-none">
                                        {key.replace(/_/g, " ")}
                                     </p>
                                     <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${val ? "text-emerald-500" : "text-rose-500"}`}>
                                        {val ? "Online / Enabled" : "Offline / Muted"}
                                     </span>
                                  </div>
                               </div>
                             ))}
                             {!selectedProvider.notificationPreferences && <p className="text-xs text-gray-500 italic">No custom preferences registered.</p>}
                          </div>
                       </div>
                    </div>
                  )}
               </div>

               {/* Admin Execution Area */}
               <div className="p-8 bg-gray-50 dark:bg-black/40 border-t border-gray-200 dark:border-white/5 flex items-center gap-4">
                  {selectedProvider.status === "pending" && (
                    <button 
                      onClick={() => acceptProvider(selectedProvider._id)}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      disabled={loading}
                    >
                       <ShieldCheck size={18} /> Accept Node
                    </button>
                  )}
                  {selectedProvider.status !== "suspended" && (
                    <button 
                      onClick={() => suspendProvider(selectedProvider._id)}
                      className="flex-1 py-4 bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-600/20 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      disabled={loading}
                    >
                       <ShieldAlert size={18} /> Terminate Access
                    </button>
                  )}
                  {selectedProvider.status === "suspended" && (
                    <button 
                      onClick={() => acceptProvider(selectedProvider._id)}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      disabled={loading}
                    >
                       <Globe size={18} /> Reactivate Hub
                    </button>
                  )}
                  {selectedProvider.noShowStrikes > 0 && (
                    <button 
                      onClick={async () => {
                        try {
                          setLoading(true);
                          await api.post(`/providers/${selectedProvider._id}/reset-strikes`);
                          alert(`No-Show strikes reset to 0 for ${selectedProvider.fullName}.`);
                          fetchProviders();
                          setSelectedProvider(null);
                        } catch (err) {
                          alert("Failed to reset strikes.");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      disabled={loading}
                    >
                       <RotateCcw size={18} /> Reset Strikes ({selectedProvider.noShowStrikes})
                    </button>
                  )}
               </div>
            </div>

            {/* Modal Exit */}
            <button 
               onClick={() => setSelectedProvider(null)}
               className="absolute top-8 right-8 p-3 bg-black/20 hover:bg-black/40 rounded-2xl text-white shadow-2xl backdrop-blur-md transition-all z-20"
            >
               <X size={20} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Verification Viewer */}
      {imageView && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setImageView("")}>
          <div className="relative w-full max-w-4xl h-full flex flex-col justify-center gap-6" onClick={e => e.stopPropagation()}>
             <div className="flex items-center justify-between bg-white/[0.02] border border-white/10 p-6 rounded-[2.5rem]">
                <div className="flex items-center gap-4 text-white">
                   <ImageIcon className="text-blue-500" size={24} />
                   <h4 className="text-xl font-black uppercase italic tracking-tighter">Document <span className="text-blue-500">Node Viewer</span></h4>
                </div>
                <button 
                  onClick={() => setImageView("")}
                  className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-500/10"
                >
                   <X size={20} />
                </button>
             </div>
             
             <div className="flex-1 relative bg-black/40 border border-white/5 rounded-[3.5rem] overflow-hidden flex items-center justify-center group">
                <img 
                  src={imageView.startsWith('http') ? imageView : `${import.meta.env.VITE_SOCKET_URL || "http://200.234.47.38:5000"}/uploads/${imageView}`} 
                  alt="Intel Source" 
                  className="max-h-full max-w-full object-contain p-4 group-hover:scale-[1.02] transition-transform duration-700"
                />
             </div>
             
             <div className="flex justify-center">
                <span className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] italic leading-none">
                   Intel Node Source: {imageView}
                </span>
             </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Providers;


