import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
   Search, Eye, X, Users as UsersIcon, UserCheck,
   ShieldAlert, Zap, Mail, Phone, MapPin,
   Calendar, Globe, MoreHorizontal, Filter,
   Shield, CheckCircle2, AlertCircle, ChevronRight,
   User, Activity, Hash, Info, Wallet, CreditCard
} from "lucide-react";
import axios from "axios";
import io from "socket.io-client";
import api from "../api";
import { useSocket } from "../context/SocketContext";

/**
 * Client Ecosystem Intelligence
 * Orchestrates customer-base management and operational visibility
 */
const Users = () => {
   const { on, emit } = useSocket();
   const location = useLocation();
   const navigate = useNavigate();
   const [filter, setFilter] = useState("All");
   const [searchTerm, setSearchTerm] = useState("");
   const [customers, setCustomers] = useState([]);
   const [selectedCustomer, setSelectedCustomer] = useState(null);
   const [modalOpen, setModalOpen] = useState(false);
   const [page, setPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [loading, setLoading] = useState(false);
   const [globalSummary, setGlobalSummary] = useState({ total: 0, active: 0, suspended: 0, new: 0 });

   useEffect(() => {
      if (location.state?.userId) {
         const targetId = location.state.userId;
         navigate(location.pathname, { replace: true, state: {} });

         const selectTarget = async () => {
            const found = customers.find(c => c._id === targetId);
            if (found) {
               setSelectedCustomer(found);
               setModalOpen(true);
            } else {
               try {
                  setLoading(true);
                  const res = await api.get("/customers?all=true");
                  const data = res.data?.customers || (Array.isArray(res.data) ? res.data : []);
                  const customer = data.find(c => c._id === targetId);
                  if (customer) {
                     setCustomers(prev => [customer, ...prev.filter(c => c._id !== targetId)]);
                     setSelectedCustomer(customer);
                     setModalOpen(true);
                  }
               } catch (err) {
                  console.error("Failed to load customer from notification state", err);
               } finally {
                  setLoading(false);
               }
            }
         };

         if (!loading) {
            selectTarget();
         }
      }
   }, [location.state, customers, loading, navigate, location.pathname]);

   // Fetch customers from backend
   const fetchCustomers = async (p = page) => {
      try {
         setLoading(true);
         const res = await api.get(`/customers?page=${p}`);
         const data = res.data?.customers || (Array.isArray(res.data) ? res.data : []);
         setCustomers(data);
         if (res.data?.pagination) {
            setTotalPages(res.data.pagination.pages);
         }
         if (res.data?.summary) {
            setGlobalSummary(res.data.summary);
         }
      } catch (error) {
         console.error("Error fetching customers:", error);
      } finally {
         setLoading(false);
      }
   };

   const updateStatus = async (id, status) => {
      try {
         setLoading(true);
         await api.put(`/customers/${id}`, { status });
         fetchCustomers();
         setModalOpen(false);
         emit("customerUpdated");
      } catch (err) {
         console.error("Error updating status:", err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchCustomers();

      const unsubAdd = on("customerAdded", (newCustomer) => {
         setCustomers((prev) => [newCustomer, ...prev]);
      });

      const unsubUpd = on("customerUpdated", (updated) => {
         setCustomers((prev) =>
            prev.map((c) => (c._id === updated._id ? updated : c))
         );
      });

      const unsubDel = on("customerDeleted", (deleted) => {
         const id = deleted?.id || deleted;
         setCustomers((prev) => prev.filter((c) => c._id !== id));
      });

      return () => {
         unsubAdd();
         unsubUpd();
         unsubDel();
      };
   }, [page, on]);

   const filters = ["All", "Active", "Suspended", "New"];

   const filteredCustomers = (Array.isArray(customers) ? customers : []).filter((customer) => {
      const matchesSearch = Object.values(customer)
         .join(" ")
         .toLowerCase()
         .includes(searchTerm.toLowerCase());

      const matchesFilter =
         filter === "All" || customer.status?.toLowerCase() === filter.toLowerCase();

      return matchesSearch && matchesFilter;
   });

   const stats = [
      {
         title: "Total Clients",
         value: globalSummary.total,
         icon: <UsersIcon size={20} />,
         color: "text-blue-500",
         bg: "bg-blue-600/10"
      },
      {
         title: "Active Nodes",
         value: globalSummary.active,
         icon: <UserCheck size={20} />,
         color: "text-emerald-500",
         bg: "bg-emerald-600/10"
      },
      {
         title: "Halted Nodes",
         value: globalSummary.suspended,
         icon: <ShieldAlert size={20} />,
         color: "text-rose-500",
         bg: "bg-rose-600/10"
      },
      {
         title: "System Expansion",
         value: globalSummary.new,
         icon: <Zap size={20} />,
         color: "text-amber-500",
         bg: "bg-amber-600/10"
      },
   ];

   const buildImageUrl = (img) => {
      if (!img) return null;
      const SERVER_URL = import.meta.env.VITE_SOCKET_URL || "http://200.234.47.38:5000";
      return img.startsWith("http") ? img : `${SERVER_URL}${img.startsWith("/") ? "" : "/"}${img}`;
   };

   const handleViewDetails = (customer) => {
      setSelectedCustomer(customer);
      setModalOpen(true);
   };

   const closeModal = () => {
      setModalOpen(false);
      setSelectedCustomer(null);
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-700">
         {/* Header Profile */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-2">
               <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic font-serif">
                  Client <span className="text-blue-600 italic">Ecosystem</span>
               </h2>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">Orchestrating Customer Success & Vital Statistics</p>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-6 py-4 rounded-[2rem] shadow-sm backdrop-blur-xl">
               <Activity className="text-blue-500" size={18} />
               <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Global Sync Status</p>
                  <p className="text-xs text-gray-900 dark:text-white font-black uppercase mt-1">Operational & Live</p>
               </div>
            </div>
         </div>

         {/* Stats Dashboard */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
            {stats.map((stat, index) => (
               <div key={index} className="group bg-white dark:bg-white/5 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-blue-500/5 rounded-full -mr-4 sm:-mr-8 -mt-4 sm:-mt-8 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
                     <div className={`p-2 sm:p-3 w-fit rounded-xl sm:rounded-2xl ${stat.bg} ${stat.color} border border-white/10 shadow-inner`}>
                        {stat.icon}
                     </div>
                     <div>
                        <h3 className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] line-clamp-1">{stat.title}</h3>
                        <p className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter mt-1 truncate">{stat.value}</p>
                     </div>
                  </div>
               </div>
            ))}
         </div>

         {/* Control Bar */}
         <div className="flex flex-col lg:flex-row items-center gap-6 mb-8 bg-white dark:bg-white/5 p-4 rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="relative flex-1 group w-full">
               <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
               <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search dispatch nodes by name, phone, or registry date..."
                  className="w-full bg-gray-50 dark:bg-black/20 border border-transparent focus:border-blue-500/50 rounded-2xl py-3.5 pl-16 pr-6 text-sm text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-500"
               />
            </div>

            <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/40 p-1.5 rounded-2xl border border-gray-200 dark:border-white/5 w-full lg:w-auto overflow-x-auto no-scrollbar">
               {filters.map((item) => (
                  <button
                     key={item}
                     onClick={() => setFilter(item)}
                     className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === item
                           ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                           : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        }`}
                  >
                     {item}
                  </button>
               ))}
            </div>
         </div>

         {/* Client Grid */}
         <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                     <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Intel Source</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Node</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sync Status</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Wallet Intel</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Registry Date</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Admin Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                     {filteredCustomers.map((customer) => (
                        <tr key={customer._id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                           <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                 <div className={`relative w-12 h-12 rounded-2xl overflow-hidden border-2 shadow-inner transition-colors ${customer.status === "Active" ? "border-emerald-500/50" : customer.status === "Suspended" ? "border-rose-500/50" : "border-amber-500/50"
                                    }`}>
                                    {buildImageUrl(customer.image) ? (
                                       <img src={buildImageUrl(customer.image)} alt={customer.name} className="w-full h-full object-cover" />
                                    ) : (
                                       <div className="w-full h-full bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold">
                                          {customer.name?.charAt(0) || <User size={20} />}
                                       </div>
                                    )}
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none group-hover:text-blue-500 transition-colors uppercase">
                                       {customer.name || "Anonymous Client"}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">ID: {customer._id.slice(-8).toUpperCase()}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-5">
                              <div className="space-y-1">
                                 <p className="text-xs font-bold text-gray-800 dark:text-gray-300 flex items-center gap-2">
                                    <Phone size={12} className="text-gray-400" /> {customer.phone || "No Data"}
                                 </p>
                                 <p className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                    <Mail size={12} className="text-gray-400" /> {customer.email || "node@hidden"}
                                 </p>
                              </div>
                           </td>
                           <td className="px-8 py-5">
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest shadow-sm ${customer.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                    customer.status === "Suspended" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                       "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                 }`}>
                                 {customer.status === "Active" ? <Shield size={12} /> : customer.status === "Suspended" ? <ShieldAlert size={12} /> : <Zap size={12} />}
                                 {customer.status || "Initialized"}
                              </div>
                           </td>
                           <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                 <Wallet size={12} className="text-blue-500" />
                                 <span className="text-sm font-black text-gray-900 dark:text-white italic tracking-tighter">₹{customer.walletBalance?.toLocaleString() || 0}</span>
                              </div>
                           </td>
                           <td className="px-8 py-5">
                              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 italic tracking-tight uppercase">
                                 {new Date(customer.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                           </td>
                           <td className="px-8 py-5">
                              <div className="flex items-center justify-center">
                                 <button
                                    onClick={() => handleViewDetails(customer)}
                                    className="p-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/5 shadow-sm transition-all"
                                 >
                                    <Eye size={18} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Dynamic Pagination Controls */}
            {totalPages > 1 && (
               <div className="mt-8 flex items-center justify-between bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-[2rem] shadow-sm">
                  <div className="flex items-center gap-2">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Registry Stream Page {page} / {totalPages}</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <button
                        disabled={page === 1 || loading}
                        onClick={() => { setPage(p => p - 1); fetchCustomers(page - 1); }}
                        className="p-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-500 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-gray-100 transition-all shadow-sm"
                     >
                        <ChevronRight size={18} className="rotate-180" />
                     </button>
                     <div className="flex gap-1.5">
                        {[...Array(totalPages)].map((_, i) => (
                           <button
                              key={i}
                              onClick={() => { setPage(i + 1); fetchCustomers(i + 1); }}
                              className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${page === i + 1
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
                        onClick={() => { setPage(p => p + 1); fetchCustomers(page + 1); }}
                        className="p-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-500 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-gray-100 transition-all shadow-sm"
                     >
                        <ChevronRight size={18} />
                     </button>
                  </div>
               </div>
            )}
         </div>

         {/* Intelligence Modal */}
         {modalOpen && selectedCustomer && createPortal(
            <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto no-scrollbar py-10">
               <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal}></div>

               <div className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-3xl md:rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500 my-auto">

                  {/* Modal Header Profile */}
                  <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700">
                     <div className="absolute inset-0 bg-black/20"></div>
                     <button onClick={closeModal} className="absolute top-6 right-8 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-2xl text-white transition-all z-20 shadow-lg border border-white/20 group">
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                     </button>
                  </div>

                  <div className="px-10 pb-10">
                     <div className="relative -mt-16 mb-8 flex flex-col items-center">
                        <div className="relative group">
                           <div className={`w-36 h-36 rounded-[2.5rem] p-1.5 border-[6px] transition-all bg-white dark:bg-[#0f172a] ${selectedCustomer.status === "Active" ? "border-emerald-500" : selectedCustomer.status === "Suspended" ? "border-rose-500" : "border-amber-500"
                              }`}>
                              <div className="w-full h-full rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-inner">
                                 {buildImageUrl(selectedCustomer.image) ? (
                                    <img src={buildImageUrl(selectedCustomer.image)} alt={selectedCustomer.name} className="w-full h-full object-cover" />
                                 ) : (
                                    <User size={48} className="text-gray-300" />
                                 )}
                              </div>
                           </div>
                           <div className={`absolute bottom-2 right-2 p-3 rounded-2xl border-[4px] border-white dark:border-[#0f172a] shadow-xl ${selectedCustomer.status === "Active" ? "bg-emerald-500 text-white" : selectedCustomer.status === "Suspended" ? "bg-rose-500 text-white" : "bg-amber-50 text-white"
                              }`}>
                              {selectedCustomer.status === "Active" ? <Shield size={18} /> : <ShieldAlert size={18} />}
                           </div>
                        </div>

                        <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mt-4">{selectedCustomer.name}</h3>
                        <div className="flex items-center gap-4 mt-2">
                           <div className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-500 uppercase tracking-widest italic">
                              {selectedCustomer.status || "Client Node"}
                           </div>
                           <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                              <Wallet size={14} /> ₹{selectedCustomer.walletBalance?.toLocaleString() || 0}
                           </div>
                        </div>
                     </div>

                     {/* Intelligence Blocks */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Identity Block */}
                        <div className="space-y-4 bg-gray-50 dark:bg-white/[0.02] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
                           <h4 className="flex items-center gap-3 text-blue-500 text-[10px] font-black uppercase tracking-widest mb-2">
                              <Info size={14} /> Identity Registry
                           </h4>
                           <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-gray-500 font-bold uppercase tracking-tighter">Registry Phone</span>
                                 <span className="text-gray-900 dark:text-white font-black">{selectedCustomer.phone}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-gray-500 font-bold uppercase tracking-tighter">Encrypted Email</span>
                                 <span className="text-blue-500 font-black italic">{selectedCustomer.email || "node@private"}</span>
                              </div>
                           </div>
                        </div>

                        {/* Logistics Block */}
                         <div className="space-y-4 bg-gray-50 dark:bg-white/[0.02] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
                            <h4 className="flex items-center gap-3 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2">
                               <MapPin size={14} /> Sector Logistics
                            </h4>
                            <div className="space-y-3">
                               <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500 font-bold uppercase tracking-tighter">Sector Colony</span>
                                  <span className="text-gray-900 dark:text-white font-black text-right max-w-[150px] truncate">
                                     {selectedCustomer.address?.colony || selectedCustomer.colony || "Sector-Node General"}
                                  </span>
                               </div>
                               <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500 font-bold uppercase tracking-tighter">House/Flat Node</span>
                                  <span className="text-gray-900 dark:text-white font-bold text-right truncate">
                                     {`${selectedCustomer.address?.houseNo || selectedCustomer.houseNo || ''} ${selectedCustomer.address?.flatNo || selectedCustomer.flatNo || ''}`.trim() || "N/A"}
                                  </span>
                               </div>
                               <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500 font-bold uppercase tracking-tighter">Site Landmark</span>
                                  <span className="text-gray-900 dark:text-white font-medium italic">
                                     {selectedCustomer.address?.landMark || selectedCustomer.landMark || "N/A"}
                                  </span>
                               </div>
                               <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500 font-bold uppercase tracking-tighter">Urban City</span>
                                  <span className="text-gray-900 dark:text-white font-bold uppercase">
                                     {selectedCustomer.address?.city || selectedCustomer.city || "N/A"}
                                  </span>
                               </div>
                               <hr className="border-white/5 my-1" />
                               <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500 font-bold uppercase tracking-tighter">Hub Pin/State</span>
                                  <span className="text-gray-700 dark:text-gray-300 font-black">
                                     {selectedCustomer.address?.pincode || selectedCustomer.pincode || selectedCustomer.address?.pinCode || selectedCustomer.pinCode || "000000"} / {selectedCustomer.address?.state || selectedCustomer.state || "N/A"}
                                  </span>
                               </div>
                            </div>
                         </div>

                        {/* Registry Block */}
                        <div className="space-y-4 bg-gray-50 dark:bg-white/[0.02] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
                           <h4 className="flex items-center gap-3 text-purple-500 text-[10px] font-black uppercase tracking-widest mb-2">
                              <Calendar size={14} /> Registry Timeline
                           </h4>
                           <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-gray-500 font-bold uppercase tracking-tighter">Node Created</span>
                                 <span className="text-gray-900 dark:text-white font-black">{new Date(selectedCustomer.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-gray-500 font-bold uppercase tracking-tighter">Last Sync Update</span>
                                 <span className="text-gray-900 dark:text-white font-black">{new Date(selectedCustomer.updatedAt || selectedCustomer.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-gray-500 font-bold uppercase tracking-tighter">Precision Coords</span>
                                 <span className="text-blue-500 font-mono text-[10px] italic">{selectedCustomer.location?.coordinates?.join(", ") || "Geo-Lock Hidden"}</span>
                              </div>
                           </div>
                        </div>

                        {/* Security Block */}
                        <div className="space-y-4 bg-gray-50 dark:bg-white/[0.02] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
                           <h4 className="flex items-center gap-3 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2">
                              <Zap size={14} /> Security Protocols
                           </h4>
                           <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-gray-500 font-bold uppercase tracking-tighter">Verification Pulse</span>
                                 <span className={`px-2 py-0.5 rounded italic font-black text-[9px] ${selectedCustomer.isVerified ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                                    {selectedCustomer.isVerified ? "PROTOCOL VERIFIED" : "AWAITING AUTH"}
                                 </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-gray-500 font-bold uppercase tracking-tighter">OTP Request Cycle</span>
                                 <span className="text-gray-900 dark:text-white font-black">{selectedCustomer.otpSendCount || 0} Attempts</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                 <span className="text-gray-500 font-bold uppercase tracking-tighter">Last Login/OTP</span>
                                 <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {selectedCustomer.lastOtpAt ? new Date(selectedCustomer.lastOtpAt).toLocaleTimeString() : "Idle Node"}
                                 </span>
                              </div>
                           </div>
                        </div>
 
                        {/* Payment Methods Block */}
                        <div className="md:col-span-2 space-y-4 bg-gray-50 dark:bg-white/[0.02] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
                           <h4 className="flex items-center gap-3 text-blue-500 text-[10px] font-black uppercase tracking-widest mb-2">
                              <Wallet size={14} /> Saved Payment Methods
                           </h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {selectedCustomer.savedPaymentMethods && selectedCustomer.savedPaymentMethods.length > 0 ? (
                                 selectedCustomer.savedPaymentMethods.map((method, idx) => (
                                    <div key={idx} className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 flex items-center justify-between">
                                       <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-lg ${method.type?.toUpperCase() === 'UPI' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                             {method.type?.toUpperCase() === 'UPI' ? <Zap size={14} /> : <CreditCard size={14} />}
                                          </div>
                                          <div>
                                             <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white">{method.type}</p>
                                             <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black italic tracking-tight break-all">
                                                {method.details}
                                             </p>
                                          </div>
                                       </div>
                                       {method.isPrimary && (
                                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-black uppercase tracking-tighter">Primary</span>
                                       )}
                                    </div>
                                 ))
                              ) : (
                                 <div className="col-span-2 py-4 text-center opacity-30 italic font-black uppercase text-[10px] tracking-widest border border-dashed border-gray-300 dark:border-white/10 rounded-2xl">
                                    No saved methods detected.
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Admin Actions */}
                     <div className="mt-10 flex gap-4">
                        {selectedCustomer.status === "Suspended" ? (
                           <button
                              onClick={() => updateStatus(selectedCustomer._id, "Active")}
                              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3"
                              disabled={loading}
                           >
                              <CheckCircle2 size={16} /> Reactivate Access
                           </button>
                        ) : (
                           <button
                              onClick={() => updateStatus(selectedCustomer._id, "Suspended")}
                              className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 transition-all flex items-center justify-center gap-3"
                              disabled={loading}
                           >
                              <ShieldAlert size={16} /> Terminate Logic
                           </button>
                        )}
                        {selectedCustomer.isActive && !selectedCustomer.isVerified && (
                           <button
                              onClick={() => updateStatus(selectedCustomer._id, "Active")}
                              className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3"
                              disabled={loading}
                           >
                              <Shield size={16} /> Verify Credentials
                           </button>
                        )}
                     </div>
                  </div>
               </div>
            </div>,
            document.body
         )}
      </div>
   );
};

export default Users;
