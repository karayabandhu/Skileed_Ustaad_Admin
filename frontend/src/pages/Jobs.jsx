import React, { useState, useContext, useEffect } from "react";
import { createPortal } from "react-dom";
import { JobContext } from "../context/jobContext";
import { X, Search, Filter, MoreHorizontal, Eye, Trash2, CheckCircle, Clock, Play, Pause, MapPin, Calendar, Clock as TimeIcon, Image as ImageIcon, Plus, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import axios from "axios";

import api from "../api";
import { useSocket } from "../context/SocketContext";
import BookingChatAdmin from "../components/BookingChatAdmin";
import { MessageCircle } from "lucide-react";

const Jobs = () => {
   const { on } = useSocket();
   const { jobs, fetchJobs, addJob } = useContext(JobContext);

   const [searchTerm, setSearchTerm] = useState("");
   const [activeTab, setActiveTab] = useState("All");
   const [selectedJob, setSelectedJob] = useState(null);
   const [loadingJob, setLoadingJob] = useState(false);
   const [editing, setEditing] = useState(false);
   const [editForm, setEditForm] = useState({});
   const [showAdd, setShowAdd] = useState(false);
   const [showChat, setShowChat] = useState(false);
   const [addQuery, setAddQuery] = useState("");
   const [toast, setToast] = useState(null);
   const [page, setPage] = useState(1);
   const [newService, setNewService] = useState({
      serviceType: "normal",
      category: "Home Services",
      subService: "",
      description: "",
      requirement: "",
      basePrice: "",
      discount: "",
      price: "",
      city: "Patna",
      image: null
   });
   const [isSubmitting, setIsSubmitting] = useState(false);
   const PAGE_SIZE = 8;

   const showToast = (message, type = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
   };

   const TOP_CITIES = [
      "Mumbai", "Delhi", "Bengaluru", "Kolkata", "Chennai", "Hyderabad", "Pune",
      "Ahmedabad", "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore",
      "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Purnea", "Vadodara"
   ];

   const handleStatusUpdate = async (id, status) => {
      try {
         await api.patch(`/jobs/${id}/status`, { status });
         await fetchJobs();
         setSelectedJob(null);
         setEditing(false);
         showToast(`Job marked ${status}`);
      } catch (e) {
         console.error("Error updating status:", e);
         showToast(e?.response?.data?.message || "Error updating status", "error");
      }
   };

   const handleDelete = async (id) => {
      if (!window.confirm("Permanently delete this job record?")) return;
      try {
         await api.delete(`/jobs/${id}`);
         await fetchJobs();
         setSelectedJob(null);
         showToast("Job record deleted", "error");
      } catch (e) {
         console.error("Error deleting job:", e);
         showToast(e?.response?.data?.message || "Error deleting job", "error");
      }
   };

   useEffect(() => {
      const refresh = () => fetchJobs();
      const unsubAdd = on("jobAdded", refresh);
      const unsubUpd = on("jobUpdated", refresh);
      const unsubDel = on("jobDeleted", refresh);

      return () => {
         unsubAdd();
         unsubUpd();
         unsubDel();
      };
   }, [fetchJobs, on]);

   const filteredJobs = (Array.isArray(jobs) ? jobs : []).filter((j) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
         (j.jobId || "").toString().toLowerCase().includes(search) ||
         (j.category || "").toString().toLowerCase().includes(search) ||
         (j.subService || "").toString().toLowerCase().includes(search) ||
         (j.city || "").toString().toLowerCase().includes(search);
      const matchesTab = activeTab === "All" || (j.status || "").toLowerCase() === activeTab.toLowerCase();
      return matchesSearch && matchesTab;
   });

   useEffect(() => setPage(1), [searchTerm, activeTab]);
   const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
   const paginatedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

   const handleView = async (job) => {
      try {
         setLoadingJob(true);
         const res = await api.get(`/jobs/${job._id}`);
         setSelectedJob(res.data.booking || res.data.job || res.data);
         setEditing(false);
      } catch (err) {
         console.error("Error loading job:", err);
         showToast("Could not load job details", "error");
      } finally {
         setLoadingJob(false);
      }
   };

   const startEditing = () => {
      const currentPrice = Number(selectedJob.price || 0);
      const currentBase = Number(selectedJob.basePrice && Number(selectedJob.basePrice) > 0 ? selectedJob.basePrice : currentPrice);
      const currentDiscount = Number(selectedJob.discount || 0);

      setEditForm({
         category: selectedJob.category,
         subService: selectedJob.subService,
         basePrice: currentBase,
         discount: currentDiscount,
         price: currentDiscount > 0 ? Math.round(currentBase - (currentBase * currentDiscount / 100)) : currentBase,
         description: selectedJob.description,
         requirement: selectedJob.requirement,
         cities: selectedJob.cities || [],
         image: null
      });
      setEditing(true);
   };

   const handleUpdate = async () => {
      try {
         let dataToSend = editForm;
         if (editForm.image) {
            const formData = new FormData();
            Object.keys(editForm).forEach(key => {
               if (key === 'image' && editForm[key]) {
                  formData.append('image', editForm[key]);
               } else if (key === 'cities') {
                  formData.append('cities', JSON.stringify(editForm[key]));
               } else {
                  formData.append(key, editForm[key]);
               }
            });
            dataToSend = formData;
         } else {
            const { image, ...rest } = editForm;
            dataToSend = rest;
         }

         const res = await api.put(`/jobs/${selectedJob._id}`, dataToSend);
         const updated = res.data.booking || res.data.job || res.data.service || res.data;
         setSelectedJob(updated);
         setEditing(false);
         await fetchJobs();
         showToast("Job updated successfully");
      } catch (e) {
         showToast(e?.response?.data?.message || "Error updating job", "error");
      }
   };

   const toggleCity = async (jobId, city, action) => {
      try {
         const endpoint = action === 'add' ? 'add-city' : 'remove-city';
         const res = await api.patch(`/jobs/${jobId}/${endpoint}`, { city });
         const updated = res.data.booking || res.data.job || res.data;
         if (updated && typeof updated === "object") {
            setSelectedJob(updated);
            setEditForm(prev => {
               if (!prev || typeof prev !== 'object') return prev;
               return {
                  ...prev,
                  cities: updated.cities || []
               };
            });
         }
         await fetchJobs();
         if (action === 'add') { setShowAdd(false); setAddQuery(""); }
         showToast(`${action === 'add' ? 'Added' : 'Removed'} ${city}`);
      } catch (e) {
         showToast(e?.response?.data?.message || `Error ${action === 'add' ? 'adding' : 'removing'} city`, "error");
      }
   };

   const handleAddService = async (e) => {
      e.preventDefault();
      try {
         setIsSubmitting(true);
         const formData = new FormData();
         Object.keys(newService).forEach(key => {
            if (key === 'image' && newService[key]) {
               formData.append('image', newService[key]);
            } else {
               formData.append(key, newService[key]);
            }
         });

         await addJob(formData);
         showToast("New service added successfully");
         setShowAdd(false);
         setNewService({
            serviceType: "normal",
            category: "Home Services",
            subService: "",
            description: "",
            requirement: "",
            basePrice: "",
            discount: "",
            price: "",
            city: "Patna",
            image: null
         });
      } catch (err) {
         showToast(err?.response?.data?.message || "Failed to add service", "error");
      } finally {
         setIsSubmitting(false);
      }
   };

   const buildImageUrl = (img) => {
      if (!img) return null;
      const SERVER_URL = import.meta.env.VITE_SOCKET_URL || "http://200.234.47.38:5000";
      return img.startsWith("http") ? img : `${SERVER_URL}${img.startsWith("/") ? "" : "/"}${img}`;
   };

   return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
         {/* Header & Search */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Jobs</h1>
               <p className="text-gray-500 text-sm mt-1">Manage active and suspended service jobs</p>
            </div>
            <div className="flex items-center gap-3">
               {/* <button 
            onClick={() => { setNewService({ ...newService, serviceType: "normal" }); setShowAdd(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all whitespace-nowrap"
          >
            <Plus size={16} /> Normal
          </button> */}

               <div className="relative w-full md:w-64 group hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                     type="text"
                     placeholder="Search..."
                     className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm dark:text-white"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>
         </div>

         {/* Tabs */}
         <div className="flex bg-gray-100 dark:bg-gray-800/50 p-1.5 rounded-2xl w-fit border border-gray-200 dark:border-gray-800">
            {["All", "Active", "Suspended"].map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab
                     ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                     : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                     }`}
               >
                  {tab}
               </button>
            ))}
         </div>

         {/* Modern Data Grid */}
         <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 tracking-widest italic font-serif">
                     <tr>
                        <th className="px-8 py-5">Job Snapshot</th>
                        <th className="px-4 py-5">Classification</th>
                        <th className="px-4 py-5">Base Price (₹)</th>
                        <th className="px-4 py-5">Discount</th>
                        <th className="px-4 py-5">Our Final Customer Price (₹)</th>
                        <th className="px-4 py-5">Locations</th>
                        <th className="px-4 py-5 font-bold">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {filteredJobs.length === 0 ? (
                        <tr>
                           <td colSpan="7" className="px-8 py-20 text-center text-gray-400 font-medium italic">
                              No booking records matching your criteria found.
                           </td>
                        </tr>
                     ) : (
                        paginatedJobs.map((j) => (
                           <tr key={j._id} className="hover:bg-gray-50/40 dark:hover:bg-gray-800/40 transition-colors group">
                              <td className="px-8 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl font-black text-xs">
                                       #{(j.jobId || j._id || "").toString().slice(-4).toUpperCase() || "NEW"}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-xs font-black text-gray-500 uppercase tracking-tighter">Reference</span>
                                       <span className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate max-w-[120px]">
                                          {j.jobId || (j._id?.toString().slice(-8).toUpperCase()) || "N/A"}
                                       </span>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-4 py-4">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tighter italic">{j.category}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                       <span className="text-[10px] text-blue-600 uppercase font-black tracking-[0.1em]">{j.providerSubService || "No Trade Set"}</span>
                                       <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${j.serviceType === "bidding" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"}`}>
                                          {j.serviceType || "normal"}
                                       </span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight mt-1">{j.subService}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-4">
                                 {j.serviceType === "bidding" ? (
                                    <span className="text-xs font-bold text-gray-400">—</span>
                                 ) : (
                                    <span className="text-sm font-black text-gray-900 dark:text-white">₹{Number(j.basePrice || j.price || 0).toLocaleString()}</span>
                                 )}
                              </td>
                              <td className="px-4 py-4">
                                 {j.serviceType === "bidding" ? (
                                    <span className="text-xs font-bold text-gray-400">—</span>
                                 ) : (
                                    <span className="text-sm font-black text-emerald-600">{j.discount ? `${j.discount}%` : "0%"}</span>
                                 )}
                              </td>
                              <td className="px-4 py-4">
                                 {j.serviceType === "bidding" ? (
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-lg">Marketplace</span>
                                 ) : (
                                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">₹{Number(j.price || 0).toLocaleString()}</span>
                                 )}
                              </td>
                              <td className="px-4 py-4">
                                 <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                    <MapPin size={12} className="text-blue-500" />
                                    <span className="truncate max-w-[150px]">{(j.cities && j.cities.length) ? j.cities.join(", ") : (j.city || "—")}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-4">
                                 <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider italic font-serif ${j.status === "active" ? "bg-emerald-500/10 text-emerald-500" :
                                    j.status === "suspended" ? "bg-rose-500/10 text-rose-500" : "bg-gray-500/10 text-gray-500"
                                    }`}>
                                    {j.status === "active" ? <Play size={10} fill="currentColor" /> : <Pause size={10} fill="currentColor" />}
                                    {j.status || "suspended"}
                                 </span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button
                                       onClick={() => handleView(j)}
                                       disabled={loadingJob}
                                       className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 text-gray-500"
                                    >
                                       <Eye size={18} />
                                    </button>
                                    <button
                                       onClick={() => handleDelete(j._id)}
                                       className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-300 text-gray-500"
                                    >
                                       <Trash2 size={18} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
               <div className="px-8 py-6 bg-gray-50/30 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Showing page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                     <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 disabled:opacity-30 transition-all text-gray-700 dark:text-white"><ChevronLeft size={16} /></button>
                     <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 disabled:opacity-30 transition-all text-gray-700 dark:text-white"><ChevronRight size={16} /></button>
                  </div>
               </div>
            )}
         </div>      {/* Enhanced Job Detail Modal */}
         {selectedJob && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedJob(null)}></div>
               <div className="relative bg-white dark:bg-gray-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 flex flex-col md:flex-row max-h-[90vh]">

                  {/* Sidebar / Image in Modal */}
                  <div className="md:w-1/3 bg-gray-100 dark:bg-gray-800 relative group overflow-hidden">
                     {editForm.image ? (
                        <img src={URL.createObjectURL(editForm.image)} alt="Preview" className="w-full h-full object-cover" />
                     ) : buildImageUrl(selectedJob.imageUrl) ? (
                        <img src={buildImageUrl(selectedJob.imageUrl)} alt="Job" className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 p-10">
                           <ImageIcon size={100} strokeWidth={1} />
                           <p className="text-xs font-black uppercase tracking-widest mt-4">No Image Available</p>
                        </div>
                     )}

                     {editing && (
                        <label className="absolute top-4 right-4 bg-blue-600/90 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl shadow-lg cursor-pointer backdrop-blur-sm z-20 flex items-center gap-1.5 transition-all">
                           <ImageIcon size={14} />
                           <span>Change Image</span>
                           <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => setEditForm({ ...editForm, image: e.target.files[0] })}
                           />
                        </label>
                     )}
                     <div className="absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-black/60 to-transparent">
                        <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] bg-blue-600 px-3 py-1 rounded-full italic">Booking Context</span>
                        <h3 className="text-white text-2xl font-black uppercase tracking-tight mt-2 italic leading-none">{selectedJob.category}</h3>
                     </div>
                     <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                        <div className="flex justify-between items-center text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">
                           <span>Base: ₹{(editing ? (editForm.basePrice !== undefined ? editForm.basePrice : editForm.price) : (selectedJob.basePrice || selectedJob.price))?.toLocaleString()}</span>
                           <span className="text-emerald-400">{editing ? (editForm.discount ? `${editForm.discount}% OFF` : 'No Disc') : (selectedJob.discount ? `${selectedJob.discount}% OFF` : 'No Disc')}</span>
                        </div>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Our Final Customer Price</p>
                        <p className="text-white text-3xl font-black">₹{(editing ? editForm.price : selectedJob.price)?.toLocaleString()}</p>
                     </div>
                  </div>

                  {/* Content in Modal */}
                  <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-h-0">
                     <div className="px-10 py-8 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur z-10">
                        <div>
                           <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] italic mb-1">Details & Logistics</h4>
                           <p className="text-sm font-bold text-gray-500 uppercase tracking-tighter">Reference ID: <span className="text-gray-900 dark:text-white">{selectedJob.jobId || ("ID-" + selectedJob._id?.toString().slice(-8).toUpperCase()) || "N/A"}</span></p>
                        </div>
                        <button onClick={() => { setSelectedJob(null); setEditing(false); }} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all text-gray-400 hover:text-rose-500"><X size={20} /></button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                        {/* Status Indicator Bar */}
                        <div className="flex items-center gap-3 p-1.5 bg-gray-50 dark:bg-gray-800 rounded-2xl w-fit border border-gray-100 dark:border-gray-700">
                           <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic font-serif shadow-sm ${selectedJob.status === "active" ? "bg-emerald-500 text-white" :
                              selectedJob.status === "suspended" ? "bg-rose-500 text-white" : "bg-gray-600 text-white"
                              }`}>
                              {selectedJob.status || "Suspended"}
                           </span>
                           <p className="text-[10px] font-bold text-gray-400 uppercase px-2">Last Updated: {new Date().toLocaleDateString()}</p>
                        </div>

                        {/* Core Info Grid */}
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Category</label>
                              {editing ? (
                                 <>
                                    <input
                                       type="text"
                                       list="sector-suggestions"
                                       className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                       value={editForm.category}
                                       onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    />
                                    <datalist id="sector-suggestions">
                                       <option value="Home Services" />
                                       <option value="Professional Works" />
                                       <option value="Digital Works" />
                                       <option value="Emergency service" />
                                       <option value="Per day Services" />
                                       <option value="Medical Helpers" />
                                    </datalist>
                                 </>
                              ) : (
                                 <p className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tighter italic">{selectedJob.category || "—"}</p>
                              )}
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Level</label>
                              {editing ? (
                                 <input
                                    type="text"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editForm.subService}
                                    onChange={(e) => setEditForm({ ...editForm, subService: e.target.value })}
                                 />
                              ) : (
                                 <p className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tighter italic">{selectedJob.subService || "—"}</p>
                              )}
                           </div>
                        </div>

                        {/* Side-by-Side Pricing & Discount Section */}
                        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing & Discount Configuration</label>
                           {editing ? (
                              <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Base Price (₹)</label>
                                       <input
                                          type="number"
                                          min="0"
                                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                          value={editForm.basePrice !== undefined ? editForm.basePrice : editForm.price}
                                          onChange={(e) => {
                                             const base = Number(e.target.value || 0);
                                             const disc = Number(editForm.discount || 0);
                                             const finalP = disc > 0 ? Math.round(base - (base * disc / 100)) : base;
                                             setEditForm({ ...editForm, basePrice: e.target.value, price: finalP });
                                          }}
                                       />
                                    </div>
                                    <div className="space-y-1">
                                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Discount (%)</label>
                                       <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                          value={editForm.discount || ""}
                                          onChange={(e) => {
                                             const disc = Number(e.target.value || 0);
                                             const base = Number(editForm.basePrice !== undefined ? editForm.basePrice : editForm.price || 0);
                                             const finalP = disc > 0 ? Math.round(base - (base * disc / 100)) : base;
                                             setEditForm({ ...editForm, discount: e.target.value, price: finalP });
                                          }}
                                       />
                                    </div>
                                 </div>
                                 <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl flex justify-between items-center border border-blue-100 dark:border-blue-800">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Our Final Customer Price</span>
                                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">₹{editForm.price}</span>
                                 </div>
                              </div>
                           ) : (
                              <div className="grid grid-cols-3 gap-4">
                                 <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Base Price</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white mt-1">₹{(selectedJob.basePrice || selectedJob.price)?.toLocaleString()}</p>
                                 </div>
                                 <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Discount</p>
                                    <p className="text-lg font-black text-emerald-500 mt-1">{selectedJob.discount ? `${selectedJob.discount}% OFF` : '0%'}</p>
                                 </div>
                                 <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                                    <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">Final Price</p>
                                    <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">₹{selectedJob.price?.toLocaleString()}</p>
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* Service Territories */}
                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                           <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Territories</label>
                              <button onClick={editing ? () => setEditing(false) : startEditing} className="text-[10px] font-black text-blue-600 uppercase italic hover:underline">{editing ? "Exit Edit Mode" : "Manage Locations & Details"}</button>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {selectedJob.cities?.map(city => (
                                 <div key={city} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300">
                                    <MapPin size={12} className="text-blue-500" />
                                    {city}
                                    {editing && <button onClick={() => toggleCity(selectedJob._id, city, 'remove')} className="text-rose-500 hover:text-rose-700 ml-1 leading-none">×</button>}
                                 </div>
                              ))}
                              {editing && (
                                 <div className="flex gap-2 w-full mt-2">
                                    <select
                                       className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                       onChange={(e) => e.target.value && toggleCity(selectedJob._id, e.target.value, 'add')}
                                       value=""
                                    >
                                       <option value="">Select city to add...</option>
                                       {TOP_CITIES.filter(c => !selectedJob.cities?.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                 </div>
                              )}
                              {!selectedJob.cities?.length && <p className="text-xs text-gray-400 italic">No assigned territories</p>}
                           </div>
                        </div>

                        {/* Description Blocks */}
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Context & Remarks</label>
                              {editing ? (
                                 <textarea
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                 />
                              ) : (
                                 <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50/50 dark:bg-gray-800/30 p-5 rounded-3xl border border-dashed border-gray-100 dark:border-gray-700 italic">
                                    "{selectedJob.description || "No supplemental descriptions provided by the administrator."}"
                                 </p>
                              )}
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Technical Requirements</label>
                              {editing ? (
                                 <textarea
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                    value={editForm.requirement}
                                    onChange={(e) => setEditForm({ ...editForm, requirement: e.target.value })}
                                 />
                              ) : (
                                 <div className="flex items-start gap-3 p-5 bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                                    <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{selectedJob.requirement || "Standard service protocols apply."}</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Action Footer */}
                     <div className="p-8 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex gap-4">
                        {editing ? (
                           <button
                              onClick={handleUpdate}
                              className="flex-1 items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all flex"
                           >
                              <CheckCircle size={16} /> Save Changes
                           </button>
                        ) : (
                           <>
                              {selectedJob.status === "active" ? (
                                 <button
                                    onClick={() => handleStatusUpdate(selectedJob._id, "suspended")}
                                    className="flex-1 items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-600/20 transition-all flex"
                                 >
                                    <Pause size={16} fill="white" /> Suspend Service
                                 </button>
                              ) : (
                                 <button
                                    onClick={() => handleStatusUpdate(selectedJob._id, "active")}
                                    className="flex-1 items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex"
                                 >
                                    <Play size={16} fill="white" /> Activate Service
                                 </button>
                              )}
                           </>
                        )}
                     </div>
                  </div>
               </div>
            </div>,
            document.body
         )}

         {/* Add Service Modal */}
         {showAdd && createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowAdd(false)}></div>
               <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 flex flex-col max-h-[90vh]">
                  <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                     <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                           Add <span className={newService.serviceType === 'bidding' ? 'text-amber-500' : 'text-blue-600'}>
                              {newService.serviceType === 'bidding' ? 'Bidding' : 'Normal'} Service
                           </span>
                        </h2>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Configure service parameters</p>
                     </div>
                     <button onClick={() => setShowAdd(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all text-gray-400 hover:text-rose-500"><X size={20} /></button>
                  </div>

                  <form onSubmit={handleAddService} className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
                     {/* Service Type Toggle */}
                     <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl w-full border border-gray-200 dark:border-gray-700">
                        {["normal", "bidding"].map((type) => (
                           <button
                              key={type}
                              type="button"
                              onClick={() => setNewService({ ...newService, serviceType: type })}
                              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${newService.serviceType === type
                                 ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                 : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                 }`}
                           >
                              {type} Service
                           </button>
                        ))}
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                           <select
                              required
                              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                              value={newService.category}
                              onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                           >
                              <option value="Home Services">Home Services</option>
                              <option value="Professional Works">Professional Works</option>
                              <option value="Digital Works">Digital Works</option>
                              <option value="Emergency service">Emergency service</option>
                              <option value="Per day Services">Per day Services</option>
                              <option value="Medical Helpers">Medical Helpers</option>
                              <option value="Biding Services">Biding Services</option>
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sub-Service Name</label>
                           <input
                              type="text"
                              required
                              placeholder="e.g. Sofa Cleaning"
                              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                              value={newService.subService}
                              onChange={(e) => setNewService({ ...newService, subService: e.target.value })}
                           />
                        </div>
                     </div>

                     {newService.serviceType === "normal" && (
                        <div className="space-y-3">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Price (₹)</label>
                                 <input
                                    type="number"
                                    required
                                    placeholder="1000"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    value={newService.basePrice !== "" ? newService.basePrice : newService.price}
                                    onChange={(e) => {
                                       const val = e.target.value;
                                       setNewService((prev) => {
                                          const base = Number(val || 0);
                                          const disc = Number(prev.discount || 0);
                                          const finalP = disc > 0 ? Math.round(base - (base * disc / 100)) : base;
                                          return { ...prev, basePrice: val, price: finalP };
                                       });
                                    }}
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discount (%)</label>
                                 <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="0"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    value={newService.discount}
                                    onChange={(e) => {
                                       const val = e.target.value;
                                       setNewService((prev) => {
                                          const disc = Number(val || 0);
                                          const base = Number(prev.basePrice !== "" ? prev.basePrice : prev.price || 0);
                                          const finalP = disc > 0 ? Math.round(base - (base * disc / 100)) : base;
                                          return { ...prev, discount: val, price: finalP };
                                       });
                                    }}
                                 />
                              </div>
                           </div>
                           <div className="bg-blue-50 dark:bg-blue-900/20 p-3.5 rounded-2xl flex items-center justify-between border border-blue-100 dark:border-blue-800/50">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Our Final Customer Price</span>
                              <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                                 ₹{newService.basePrice !== "" ? (newService.discount > 0 ? Math.round(Number(newService.basePrice || 0) * (1 - Number(newService.discount || 0)/100)) : Number(newService.basePrice || 0)) : (newService.price || 0)}
                              </span>
                           </div>
                        </div>
                     )}

                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                        <textarea
                           required
                           placeholder="Detailed service description..."
                           className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white min-h-[100px]"
                           value={newService.description}
                           onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                        />
                     </div>

                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requirements</label>
                        <textarea
                           required
                           placeholder="What the provider needs to know..."
                           className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white min-h-[80px]"
                           value={newService.requirement}
                           onChange={(e) => setNewService({ ...newService, requirement: e.target.value })}
                        />
                     </div>

                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Image</label>
                        <div className="flex items-center gap-4">
                           <div className="h-20 w-20 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                              {newService.image ? (
                                 <img src={URL.createObjectURL(newService.image)} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                 <ImageIcon size={24} className="text-gray-400" />
                              )}
                           </div>
                           <label className="flex-1">
                              <span className="inline-block bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-blue-100 transition-colors">
                                 Choose File
                              </span>
                              <input
                                 type="file"
                                 className="hidden"
                                 onChange={(e) => setNewService({ ...newService, image: e.target.files[0] })}
                              />
                           </label>
                        </div>
                     </div>

                     <div className="pt-4">
                        <button
                           type="submit"
                           disabled={isSubmitting}
                           className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
                        >
                           {isSubmitting ? "Adding Service..." : "Create Service"}
                        </button>
                     </div>
                  </form>
               </div>
            </div>,
            document.body
         )}

         {/* Toast Notification */}
         {toast && (
            <div className={`fixed bottom-10 right-10 flex items-center gap-3 px-6 py-4 rounded-[2rem] shadow-2xl z-[1000] border backdrop-blur-md animate-in slide-in-from-right duration-300 ${toast.type === "error" ? "bg-rose-500/90 border-rose-400 text-white" :
               toast.type === "warning" ? "bg-orange-500/90 border-orange-400 text-white" :
                  "bg-emerald-500/90 border-emerald-400 text-white"
               }`}>
               {toast.type === "error" ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
               <span className="text-sm font-black uppercase tracking-widest font-serif italic italic">{toast.message}</span>
               <button onClick={() => setToast(null)} className="ml-2 hover:opacity-50"><X size={16} /></button>
            </div>
         )}
      </div>
   );
};

export default Jobs;

