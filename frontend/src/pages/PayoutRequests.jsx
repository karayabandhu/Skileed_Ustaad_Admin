import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DollarSign, Clock, CheckCircle, XCircle,
  Search, Eye, MoreHorizontal, User,
  MapPin, Phone, MessageSquare, AlertCircle,
  HelpCircle, MoreVertical, Filter, Loader2, RefreshCw, Upload, Image as ImageIcon,
  ChevronLeft, ChevronRight
} from "lucide-react";
import api from "../api";
import { useSocket } from "../context/SocketContext";

/**
 * Provider Payout Request Intelligence Center
 * Handles tracking, approval, and logistics of platform payouts
 */
const PayoutRequests = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);

  useEffect(() => {
    if (location.state?.payoutId) {
      const targetId = location.state.payoutId;
      navigate(location.pathname, { replace: true, state: {} });

      const selectTarget = async () => {
        const found = requests.find(r => r._id === targetId);
        if (found) {
          setSelectedRequest(found);
          setModalOpen(true);
        } else {
          try {
            setLoading(true);
            const res = await api.get("/payouts?all=true");
            const raw = res.data?.payouts || (Array.isArray(res.data) ? res.data : []);
            const payout = raw.find(r => r._id === targetId);
            if (payout) {
              setRequests(prev => [payout, ...prev.filter(r => r._id !== targetId)]);
              setSelectedRequest(payout);
              setModalOpen(true);
            }
          } catch (err) {
            console.error("Failed to load payout from notification state", err);
          } finally {
            setLoading(false);
          }
        }
      };

      if (!loading) {
        selectTarget();
      }
    }
  }, [location.state, requests, loading, navigate, location.pathname]);

  // Fetch payout requests from the backend
  const fetchPayouts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/payouts?page=${pageNum}&limit=${limit}`);
      if (res.data?.success) {
        setRequests(res.data.payouts || []);
        setTotalPages(res.data.pagination?.pages || 1);
        setTotalItems(res.data.pagination?.total || 0);
        setPage(res.data.pagination?.page || 1);
      } else {
        // Fallback for old API format if still active
        setRequests(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts(page);
  }, [page]);

  // Real-time updates
  const { on } = useSocket();

  useEffect(() => {
    const unsub = on("new_payout_request", (data) => {
      // console.log("Real-time new payout request received:", data);
      // Fetch latest payouts to ensure sorting and population are correct
      const fetchNewData = async () => {
        try {
          const res = await api.get("/payouts");
          setRequests(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
          console.error("Error refreshing payouts on socket event:", error);
        }
      };
      fetchNewData();
    });
    return unsub;
  }, [on]);

  const handleProcessRequest = async (id, status) => {
    try {
      setProcessing(true);

      const formData = new FormData();
      formData.append("status", status);
      formData.append("remarks", remarks);
      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }

      const res = await api.put(`/payouts/${id}/process`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const updatedPayout = res.data.payout;

      // Update local state
      setRequests(prev => prev.map(r =>
        r._id === id ? {
          ...r,
          status: updatedPayout.status,
          remarks: updatedPayout.remarks,
          receipt: updatedPayout.receipt,
          processedAt: updatedPayout.processedAt
        } : r
      ));

      setModalOpen(false);
      setRemarks("");
      setReceiptFile(null);
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error processing payout:", error);
      alert("Failed to update payout status.");
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = (requests || []).filter(req => {
    const provider = req.providerId || {};
    const matchesSearch =
      (provider.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (provider.phoneNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(req.amount).includes(searchTerm);

    const matchesFilter = filter === "All" || req.status === filter;

    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-700 border-amber-200/50";
      case "Approved": return "bg-emerald-100 text-emerald-700 border-emerald-200/50";
      case "Rejected": return "bg-rose-100 text-rose-700 border-rose-200/50";
      default: return "bg-gray-100 text-gray-700 border-gray-200/50";
    }
  };

  const summary = {
    total: requests.length,
    pending: requests.filter(r => r.status === "Pending").length,
    approved: requests.filter(r => r.status === "Approved").length,
    rejected: requests.filter(r => r.status === "Rejected").length,
    totalAmount: requests.reduce((acc, r) => acc + (r.amount || 0), 0)
  };

  const stats = [
    { title: "Total Requests", value: summary.total, icon: <DollarSign size={20} />, color: "text-blue-500", bg: "bg-blue-600/10" },
    { title: "Pending Nodes", value: summary.pending, icon: <Clock size={20} />, color: "text-amber-500", bg: "bg-amber-600/10" },
    { title: "Executed Logic", value: summary.approved, icon: <CheckCircle size={20} />, color: "text-emerald-500", bg: "bg-emerald-600/10" },
    { title: "Void Systems", value: `₹${summary.totalAmount.toLocaleString()}`, icon: <HelpCircle size={20} />, color: "text-purple-500", bg: "bg-purple-600/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic font-serif">
            Payout <span className="text-blue-600 italic">Protocols</span>
          </h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">Orchestrating Provider Liquidity & Transaction Integrity</p>
        </div>

        <div className="flex items-center gap-3 relative">
          <button
            onClick={fetchPayouts}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> {loading ? "Syncing..." : "Refresh"}
          </button>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 px-6 py-3 border rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest transition-all ${filter !== "All"
                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:text-blue-600"
              }`}
          >
            <Filter size={16} /> {filter === "All" ? "Filters" : `Status: ${filter}`}
          </button>

          {/* Filter Dropdown */}
          {filterOpen && (
            <div className="absolute top-full right-0 mt-3 w-48 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/10 rounded-[2rem] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 shadow-blue-500/10">
              {["All", "Pending", "Approved", "Rejected"].map((item) => (
                <button
                  key={item}
                  onClick={() => { setFilter(item); setFilterOpen(false); }}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === item
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analytics Dashboard */}
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
            placeholder="Synchronize by node name, ID, or amount..."
            className="w-full bg-gray-50 dark:bg-black/20 border border-transparent focus:border-blue-500/50 rounded-2xl py-3.5 pl-16 pr-6 text-sm text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 size={40} className="animate-spin text-blue-500" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-20 text-center">
            <DollarSign size={64} className="mx-auto text-gray-200 mb-6" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm italic">System currently void of active payout cycles.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Provider Intel</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Liquidity Payload</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Protocol Status</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Requested Date</th>
                  <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Admin Logic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredRequests.map((req) => (
                  <tr key={req._id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold border border-blue-500/10">
                          {req.providerId?.fullName?.[0] || <User size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none truncate max-w-[150px]">
                            {req.providerId?.fullName || "Redacted Provider"}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest truncate max-w-[150px] italic">
                            {req.providerId?.serviceCategory || "Undefined Service"}
                            {req.providerId?.providerSubService && ` • ${req.providerId.providerSubService}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-gray-900 dark:text-white italic tracking-tighter">₹{req.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest italic ${getStatusStyle(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{new Date(req.requestedAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => { setSelectedRequest(req); setModalOpen(true); }}
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
        )}
      </div>

      {/* Pagination Controls */}
      {requests.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-8 pb-10">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1 || loading}
            className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-700 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
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
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${page === pageNum
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-2 ring-blue-600/20"
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

      {/* Intelligence Modal */}
      {modalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setModalOpen(false)}></div>

          <div className="bg-white dark:bg-[#0f172a] w-full max-w-xl rounded-[2.5rem] shadow-[0_0_100px_rgba(37,99,235,0.1)] border border-white/10 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Process <span className="text-blue-600">Liquidity Cycle</span></h3>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Request ID: {selectedRequest._id.toUpperCase()}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* Provider Info Block */}
              <div className="flex gap-4 p-5 bg-gray-50 dark:bg-white/[0.02] rounded-3xl border border-gray-100 dark:border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 font-black italic shadow-inner">
                  {selectedRequest.providerId?.fullName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{selectedRequest.providerId?.fullName}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{selectedRequest.providerId?.phoneNumber}</p>
                </div>
              </div>

              {/* Financial Intel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-gray-50 dark:bg-white/[0.02] rounded-3xl border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <DollarSign size={12} className="text-emerald-500" /> Amount
                  </p>
                  <p className="text-2xl font-black text-emerald-600 tracking-tighter italic">₹{selectedRequest.amount.toLocaleString()}</p>
                </div>
                <div className="p-5 bg-gray-50 dark:bg-white/[0.02] rounded-3xl border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Clock size={12} className="text-blue-500" /> Cycles
                  </p>
                  <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight italic">{new Date(selectedRequest.requestedAt).toLocaleTimeString()}</p>
                </div>
              </div>

              {/* Bank Logic */}
              <div className="p-6 bg-blue-600/5 dark:bg-blue-600/[0.03] rounded-3xl border border-blue-600/10 space-y-4">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={14} /> Registered Transaction Nodes
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold uppercase">Account Node</span>
                    <span className="text-gray-900 dark:text-white font-black tracking-widest">{selectedRequest.bankDetails?.accountNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold uppercase">IFSC Logic</span>
                    <span className="text-gray-900 dark:text-white font-black tracking-widest">{selectedRequest.bankDetails?.ifscCode || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold uppercase">UPI ID Site</span>
                    <span className="text-blue-500 font-black italic">{selectedRequest.bankDetails?.upiId || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Admin Response Logic */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Admin Transaction Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Input transition details or rejection causes..."
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-blue-500/50 rounded-2xl py-4 px-6 text-sm italic text-gray-900 dark:text-white outline-none resize-none h-24 transition-all"
                />
              </div>

              {/* Receipt Upload */}
              {selectedRequest.status === "Pending" && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Transaction Receipt (Optional)</label>
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      onChange={(e) => setReceiptFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                      accept="image/*,application/pdf"
                    />
                    <div className="w-full bg-blue-600/5 hover:bg-blue-600/10 dark:bg-blue-600/[0.03] dark:hover:bg-blue-600/[0.05] border-2 border-dashed border-blue-600/20 group-hover:border-blue-600/40 rounded-3xl py-6 px-6 transition-all flex flex-col items-center justify-center gap-2">
                      {receiptFile ? (
                        <>
                          <CheckCircle size={24} className="text-emerald-500" />
                          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest truncate max-w-full italic px-4">
                            {receiptFile.name}
                          </p>
                          <button onClick={(e) => { e.stopPropagation(); setReceiptFile(null); }} className="text-[9px] font-bold text-rose-500 uppercase tracking-[0.2em] mt-1 hover:underline">Remove Node Data</button>
                        </>
                      ) : (
                        <>
                          <Upload size={24} className="text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                          <p className="text-xs font-black text-gray-400 group-hover:text-blue-500 uppercase tracking-[0.2em] transition-colors italic">Attach Proof of Transfer</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-60">PNG, JPG, or PDF (Max 5MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Receipt View */}
              {selectedRequest.receipt && (
                <div className="p-4 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon size={20} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Receipt Locked to Node</span>
                  </div>
                  <a
                    href={selectedRequest.receipt.startsWith('http')
                      ? selectedRequest.receipt
                      : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}${selectedRequest.receipt.startsWith('/') ? '' : '/'}${selectedRequest.receipt}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Decrypt Buffer
                  </a>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => handleProcessRequest(selectedRequest._id, "Rejected")}
                  disabled={processing || selectedRequest.status !== "Pending"}
                  className="flex-1 py-4 bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-600/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-600/10 flex items-center justify-center gap-2 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-rose-600"
                >
                  <XCircle size={16} /> Void Cycle
                </button>
                <button
                  onClick={() => handleProcessRequest(selectedRequest._id, "Approved")}
                  disabled={processing || selectedRequest.status !== "Pending"}
                  className="flex-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-30 disabled:hover:bg-emerald-600 grow"
                >
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Execute Payload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutRequests;
