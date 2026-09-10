import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, ShieldAlert, Cpu, Database, 
  MessageSquare, BookOpen, HelpCircle,
  Phone, Mail, Zap, ChevronDown, ChevronUp,
  Activity, AlertTriangle, Terminal,
  Send, ExternalLink, Search, Filter,
  User, Wrench, RefreshCw, CheckCircle2,
  Clock, XCircle, Inbox, Layers, CheckCircle
} from "lucide-react";

import api from "../api";
import { useSocket } from "../context/SocketContext";

/**
 * Elite Admin Operations & Help Desk
 * Restructured into separate dedicated workspaces for Inbound Intelligence (Tickets),
 * Sec-Ops Terminal (System Anomalies), and Operational SOPs.
 */
const Support = () => {
  // Top-level Navigation Mode: "inbound" | "secops" | "sops"
  const [activeTab, setActiveTab] = useState("inbound");

  // Inbound Intelligence Filters & State
  const [queries, setQueries] = useState([]);
  const [ticketRoleFilter, setTicketRoleFilter] = useState("all"); // "all" | "customer" | "provider"
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all"); // "all" | "pending" | "resolved" | "ignored"
  const [ticketSearch, setTicketSearch] = useState("");

  // Sec-Ops Terminal State & Filters
  const [secOpsReports, setSecOpsReports] = useState([]);
  const [secOpsFormData, setSecOpsFormData] = useState({
    subject: "",
    priority: "Standard",
    message: "",
  });
  const [secOpsPriorityFilter, setSecOpsPriorityFilter] = useState("all");
  const [secOpsStatusFilter, setSecOpsStatusFilter] = useState("all");
  const [secOpsSearch, setSecOpsSearch] = useState("");

  // SOPs & Modal State
  const [activeSop, setActiveSop] = useState(null);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [showProtocolModal, setShowProtocolModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submittingSecOps, setSubmittingSecOps] = useState(false);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/support/queries");
      setQueries(res.data || []);
    } catch (err) {
      console.error("Error fetching support queries:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecOpsReports = async () => {
    try {
      const res = await api.get("/sec-ops/reports");
      setSecOpsReports(res.data || []);
    } catch (err) {
      console.error("Error fetching Sec-Ops reports:", err);
    }
  };

  const { on } = useSocket();

  useEffect(() => {
    fetchQueries();
    fetchSecOpsReports();

    // Real-time socket listener for incoming support queries
    const unsub = on("support_query", (newQuery) => {
      setQueries((prev) => [newQuery, ...prev]);
    });

    return unsub;
  }, [on]);

  // Handle Query Status Update (Pending / Resolved / Ignored)
  const handleUpdateTicketStatus = async (queryId, newStatus) => {
    try {
      const res = await api.put(`/support/queries/${queryId}/status`, { status: newStatus });
      if (res.data?.success) {
        setQueries((prev) =>
          prev.map((q) => (q._id === queryId ? { ...q, status: newStatus } : q))
        );
      }
    } catch (err) {
      console.error("Failed to update query status:", err);
    }
  };

  // Handle Sec-Ops Report Submission
  const handleSecOpsSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingSecOps(true);
      const res = await api.post("/sec-ops/report", secOpsFormData);
      if (res.data?.success) {
        alert("🚨 SEC-OPS System Anomaly Report Dispatched!");
        setSecOpsFormData({ subject: "", priority: "Standard", message: "" });
        fetchSecOpsReports();
      }
    } catch (err) {
      console.error("Error submitting Sec-Ops report:", err);
      alert("Failed to dispatch intelligence report.");
    } finally {
      setSubmittingSecOps(false);
    }
  };

  // Handle Sec-Ops Status Update
  const handleUpdateSecOpsStatus = async (reportId, newStatus) => {
    try {
      const res = await api.put(`/sec-ops/reports/${reportId}/status`, { status: newStatus });
      if (res.data?.success) {
        setSecOpsReports((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      console.error("Failed to update Sec-Ops report status:", err);
    }
  };

  // System Status Bar
  const systemStatus = [
    { label: "Registry API", status: "Operational", icon: <Cpu size={16} />, color: "text-emerald-500" },
    { label: "Socket Node", status: "Operational", icon: <Zap size={16} />, color: "text-emerald-500" },
    { label: "Data Warehouse", status: "Operational", icon: <Database size={16} />, color: "text-emerald-500" },
    { label: "Auth Gateway", status: "Operational", icon: <ShieldCheck size={16} />, color: "text-emerald-500" },
  ];

  // SOPs list
  const adminSops = [
    {
      title: "Provider Verification Protocol",
      content: "All providers must undergo document verification within 24 hours of registration. Check 'Security Vault' for Government ID and Skill Certifications before authorizing 'Active' status.",
      details: [
        "Phase 1: Authenticate Identity Document (Aadhar/PAN/Voter ID).",
        "Phase 2: Verify Service Domain Certifications (Licenses/Trade Proof).",
        "Phase 3: Conduct Digital Background Pulse (Social/Reference Check).",
        "Phase 4: Activate Node Registry upon 100% data parity."
      ]
    },
    {
      title: "Financial Conflict Resolution",
      content: "In case of payment discrepancies, freeze the transaction node and escalate to the Senior Finance Hub. Do not manually override platform commissions without audit clearance.",
      details: [
        "Step 1: Isolate the Transaction Hash in the Finance Terminal.",
        "Step 2: Cross-reference Platform Ledger vs Gateway Callback Payload.",
        "Step 3: Trigger 'Disputed' flag to prevent automatic settlement cycles.",
        "Step 4: Engage Customer/Provider via Intercepted Chat Node."
      ]
    },
    {
      title: "System Anomaly Escalation",
      content: "If the 'Vitality Index' drops below 85%, trigger a manual sync of current jobs across all socket clusters and notify the Cloud Infrastructure team immediately.",
      details: [
        "Protocol A: Initiate Force-Sync on 'Jobs' and 'Providers' nodes.",
        "Protocol B: Monitor Socket Cluster Health for latency spikes.",
        "Protocol C: Broadcast 'System Maintenance' alert if parity fails.",
        "Protocol D: Log Anomaly to SEC-OPS for post-incident analysis."
      ]
    },
    {
      title: "Client Suspension Policy",
      content: "Suspend client accounts only after 3 consecutive policy violations or verified reports of fraudulent interaction. Each suspension requires a 'Reason Node' attachment.",
      details: [
        "Metric 1: Track cancellation frequency vs completion ratio.",
        "Metric 2: Audit communication logs for Harassment/Policy Breach.",
        "Metric 3: Apply 'Halt' status to the User Identity Registry.",
        "Metric 4: Archive session data for potential legal discovery."
      ]
    },
  ];

  // Computed Metrics for Support Queries
  const totalQueries = queries.length;
  const customerQueries = queries.filter((q) => q.userType === "customer" || !q.userType || q.userType === "general");
  const providerQueries = queries.filter((q) => q.userType === "provider");
  const pendingQueries = queries.filter((q) => q.status === "pending" || !q.status);
  const resolvedQueries = queries.filter((q) => q.status === "resolved");

  // Computed Metrics for Sec-Ops
  const totalSecOps = secOpsReports.length;
  const criticalSecOps = secOpsReports.filter((r) => r.priority === "Critical");
  const highSecOps = secOpsReports.filter((r) => r.priority === "High");

  // Filtered Queries
  const filteredQueries = queries.filter((q) => {
    const isCustomer = q.userType === "customer" || !q.userType || q.userType === "general";
    const isProvider = q.userType === "provider";

    if (ticketRoleFilter === "customer" && !isCustomer) return false;
    if (ticketRoleFilter === "provider" && !isProvider) return false;

    if (ticketStatusFilter !== "all") {
      const status = q.status || "pending";
      if (status !== ticketStatusFilter) return false;
    }

    if (ticketSearch.trim()) {
      const term = ticketSearch.toLowerCase();
      const name = (q.name || "").toLowerCase();
      const email = (q.email || "").toLowerCase();
      const subject = (q.subject || "").toLowerCase();
      const message = (q.message || "").toLowerCase();
      return name.includes(term) || email.includes(term) || subject.includes(term) || message.includes(term);
    }

    return true;
  });

  // Filtered SecOps Reports
  const filteredSecOps = secOpsReports.filter((r) => {
    if (secOpsPriorityFilter !== "all" && r.priority !== secOpsPriorityFilter) return false;
    if (secOpsStatusFilter !== "all" && (r.status || "pending") !== secOpsStatusFilter) return false;
    if (secOpsSearch.trim()) {
      const term = secOpsSearch.toLowerCase();
      const subject = (r.subject || "").toLowerCase();
      const message = (r.message || "").toLowerCase();
      return subject.includes(term) || message.includes(term);
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-8 font-sans bg-[#f8fafc] dark:bg-[#020617] min-h-screen text-gray-900 dark:text-white transition-colors duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic font-serif">
            Operations <span className="text-blue-600 italic">& Support Hub</span>
          </h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">
            Administrative Control Center & Intelligence Hub
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchQueries(); fetchSecOpsReports(); }}
            className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline uppercase tracking-wider text-[10px]">Sync Hub</span>
          </button>

          <div className="hidden lg:flex items-center gap-4">
            {systemStatus.map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
                <span className={s.color}>{s.icon}</span>
                <span className="text-[10px] text-gray-800 dark:text-gray-200 font-black uppercase tracking-widest">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace Mode Navigation Bar */}
      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] p-2 mb-8 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("inbound")}
          className={`flex-1 min-w-[200px] py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
            activeTab === "inbound"
              ? "bg-blue-600 text-white shadow-xl shadow-blue-600/25"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
          }`}
        >
          <Inbox size={18} />
          Inbound Intelligence
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeTab === "inbound" ? "bg-white/20 text-white" : "bg-blue-600/10 text-blue-600 dark:text-blue-400"
          }`}>
            {totalQueries}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("secops")}
          className={`flex-1 min-w-[200px] py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
            activeTab === "secops"
              ? "bg-rose-600 text-white shadow-xl shadow-rose-600/25"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
          }`}
        >
          <Terminal size={18} />
          Sec-Ops Terminal
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeTab === "secops" ? "bg-white/20 text-white" : "bg-rose-600/10 text-rose-600 dark:text-rose-400"
          }`}>
            {totalSecOps}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("sops")}
          className={`flex-1 min-w-[200px] py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
            activeTab === "sops"
              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/25"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
          }`}
        >
          <BookOpen size={18} />
          Protocol & SOP Vault
        </button>
      </div>

      {/* ==================================================================== */}
      {/* MODE 1: INBOUND INTELLIGENCE (CUSTOMER vs PROVIDER SUPPORT TICKETS)  */}
      {/* ==================================================================== */}
      {activeTab === "inbound" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0f172a] p-6 rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Support Inquiries</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter">{totalQueries}</h3>
              </div>
              <div className="p-4 bg-blue-600/10 text-blue-600 rounded-2xl">
                <Inbox size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] p-6 rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Customer Tickets</p>
                <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400 italic tracking-tighter">{customerQueries.length}</h3>
              </div>
              <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl">
                <User size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] p-6 rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Provider Tickets</p>
                <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400 italic tracking-tighter">{providerQueries.length}</h3>
              </div>
              <div className="p-4 bg-purple-500/10 text-purple-500 rounded-2xl">
                <Wrench size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] p-6 rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pending Resolution</p>
                <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 italic tracking-tighter">{pendingQueries.length}</h3>
              </div>
              <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
                <Clock size={24} />
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white dark:bg-[#0f172a] rounded-[2.5rem] p-6 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Origin Role Tabs: All vs Customer vs Provider */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl overflow-x-auto">
              <button
                onClick={() => setTicketRoleFilter("all")}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  ticketRoleFilter === "all"
                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                All Tickets ({totalQueries})
              </button>
              <button
                onClick={() => setTicketRoleFilter("customer")}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                  ticketRoleFilter === "customer"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-blue-500 hover:bg-blue-600/10"
                }`}
              >
                <User size={14} /> Customer ({customerQueries.length})
              </button>
              <button
                onClick={() => setTicketRoleFilter("provider")}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                  ticketRoleFilter === "provider"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-purple-500 hover:bg-purple-600/10"
                }`}
              >
                <Wrench size={14} /> Provider ({providerQueries.length})
              </button>
            </div>

            {/* Status Filter & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl w-full sm:w-auto">
                {["all", "pending", "resolved", "ignored"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all capitalize ${
                      ticketStatusFilter === st
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, email..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tickets Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQueries.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-gray-200 dark:border-white/10">
                <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No support tickets found</p>
                <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              filteredQueries.map((q) => {
                const isProvider = q.userType === "provider";
                const isResolved = q.status === "resolved";
                const isIgnored = q.status === "ignored";

                return (
                  <div
                    key={q._id}
                    className={`bg-white dark:bg-[#0f172a] rounded-[2.5rem] p-6 border shadow-sm flex flex-col justify-between transition-all hover:shadow-xl ${
                      isProvider
                        ? "border-purple-200 dark:border-purple-500/20 hover:border-purple-500/50"
                        : "border-blue-200 dark:border-blue-500/20 hover:border-blue-500/50"
                    }`}
                  >
                    <div>
                      {/* Ticket Header: Origin Tag & Date */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span
                          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                            isProvider
                              ? "bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              : "bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {isProvider ? (
                            <>
                              <Wrench size={12} /> PROVIDER TICKET
                            </>
                          ) : (
                            <>
                              <User size={12} /> CUSTOMER TICKET
                            </>
                          )}
                        </span>

                        <span className="text-[10px] font-bold text-gray-400">
                          {new Date(q.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Subject & User Info */}
                      <h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-snug mb-1">
                        {q.subject || "No Subject"}
                      </h4>
                      
                      <div className="space-y-0.5 mb-4">
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          From: <span className="font-black italic">{q.name || "Anonymous"}</span>
                        </p>
                        <p className="text-[11px] text-gray-500 font-medium">{q.email}</p>
                        {q.phone && (
                          <p className="text-[11px] text-gray-500 font-medium">📞 {q.phone}</p>
                        )}
                      </div>

                      {/* Message Content Box */}
                      <div className="p-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl mb-6">
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic">
                          "{q.message}"
                        </p>
                      </div>
                    </div>

                    {/* Footer Actions & Status Changer */}
                    <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-3">
                      
                      {/* Status Selector */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateTicketStatus(q._id, "resolved")}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                            isResolved
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-emerald-500/20 hover:text-emerald-600"
                          }`}
                          title="Mark Resolved"
                        >
                          <CheckCircle2 size={12} />
                          {isResolved ? "Resolved" : "Resolve"}
                        </button>

                        <button
                          onClick={() => handleUpdateTicketStatus(q._id, "ignored")}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                            isIgnored
                              ? "bg-gray-700 text-white shadow-sm"
                              : "bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-600"
                          }`}
                          title="Ignore Ticket"
                        >
                          Ignore
                        </button>
                      </div>

                      {/* Email Reply Button */}
                      <button
                        onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${q.email}&su=Re: ${encodeURIComponent(q.subject || "Support Query")}`, "_blank")}
                        className="p-2.5 bg-blue-600/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-1 text-[10px] font-black uppercase"
                        title="Reply via Email"
                      >
                        <ExternalLink size={14} /> Reply
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODE 2: SEC-OPS TERMINAL (TECHNICAL INCIDENT DISPATCH & ANOMALY LOGS) */}
      {/* ==================================================================== */}
      {activeTab === "secops" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* SecOps Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#0f172a] p-6 rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Sec-Ops Reports</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter">{totalSecOps}</h3>
              </div>
              <div className="p-4 bg-rose-600/10 text-rose-600 rounded-2xl">
                <Terminal size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] p-6 rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Critical Priority</p>
                <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 italic tracking-tighter">{criticalSecOps.length}</h3>
              </div>
              <div className="p-4 bg-rose-600/10 text-rose-600 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] p-6 rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">High Priority</p>
                <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 italic tracking-tighter">{highSecOps.length}</h3>
              </div>
              <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
                <Activity size={24} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Side: Dispatch Form (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-white/5 space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-600/10 text-rose-500 rounded-2xl">
                    <Terminal size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter italic">Dispatch Sec-Ops Report</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">System Anomaly Issue Terminal</p>
                  </div>
                </div>
              </div>

              <form className="p-6 sm:p-8 space-y-6" onSubmit={handleSecOpsSubmit}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Report Priority</label>
                  <div className="flex gap-2">
                    {["Standard", "High", "Critical"].map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setSecOpsFormData({ ...secOpsFormData, priority: p })}
                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          secOpsFormData.priority === p
                            ? p === "Critical"
                              ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                              : p === "High"
                              ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                              : "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : "bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Subject Node</label>
                  <input
                    type="text"
                    value={secOpsFormData.subject}
                    onChange={(e) => setSecOpsFormData({ ...secOpsFormData, subject: e.target.value })}
                    placeholder="e.g. Gateway Latency Spike, Socket Disconnect..."
                    required
                    className="w-full p-4 bg-gray-50 dark:bg-black/20 border border-transparent focus:border-rose-500/50 rounded-2xl text-xs font-bold text-gray-900 dark:text-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Intel Logs & Details</label>
                  <textarea
                    rows={6}
                    value={secOpsFormData.message}
                    onChange={(e) => setSecOpsFormData({ ...secOpsFormData, message: e.target.value })}
                    placeholder="Provide technical stack traces, error codes, or reproduction sequence..."
                    required
                    className="w-full p-4 bg-gray-50 dark:bg-black/20 border border-transparent focus:border-rose-500/50 rounded-2xl text-xs font-bold text-gray-900 dark:text-white outline-none transition-all resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submittingSecOps}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 transition-all flex items-center justify-center gap-3"
                >
                  <Send size={16} /> {submittingSecOps ? "Dispatching..." : "Dispatch System Report"}
                </button>
              </form>
            </div>

            {/* Right Side: Sec-Ops Anomaly Feed (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-600/10 text-rose-500 rounded-2xl">
                      <Activity size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter italic">Sec-Ops Anomaly Feed</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Registry of Internal System Logs</p>
                    </div>
                  </div>
                </div>

                {/* SecOps Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-full sm:w-auto">
                    {["all", "Critical", "High", "Standard"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setSecOpsPriorityFilter(p)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          secOpsPriorityFilter === p
                            ? "bg-rose-600 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-48">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search log..."
                      value={secOpsSearch}
                      onChange={(e) => setSecOpsSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Feed List */}
              <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto no-scrollbar">
                {filteredSecOps.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 font-black uppercase text-xs tracking-widest">
                    No Sec-Ops reports logged.
                  </div>
                ) : (
                  filteredSecOps.map((r) => {
                    const status = r.status || "pending";

                    return (
                      <div
                        key={r._id}
                        className="p-5 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-3xl group hover:border-rose-500/30 transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                r.priority === "Critical"
                                  ? "bg-rose-600 text-white"
                                  : r.priority === "High"
                                  ? "bg-amber-600 text-white"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              {r.priority}
                            </span>

                            <span className="text-[10px] font-bold text-gray-400">
                              {new Date(r.createdAt).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {/* Status Actions */}
                          <div className="flex items-center gap-1">
                            {["pending", "investigating", "resolved"].map((st) => (
                              <button
                                key={st}
                                onClick={() => handleUpdateSecOpsStatus(r._id, st)}
                                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                  status === st
                                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                                    : "bg-gray-200 dark:bg-white/5 text-gray-500 hover:text-gray-900"
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white mb-1">
                            {r.subject}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic border-l-2 border-rose-500/30 pl-3">
                            "{r.message}"
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODE 3: PROTOCOL & SOP VAULT (OPERATIONAL SOPS & CRISIS LINES)      */}
      {/* ==================================================================== */}
      {activeTab === "sops" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
          
          {/* SOP Accordions (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600/10 text-indigo-500 rounded-2xl">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Operational SOPs</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Standard Operating Procedures</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {adminSops.map((sop, i) => (
                <div key={i} className="border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden transition-all">
                  <button
                    onClick={() => setActiveSop(activeSop === i ? null : i)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-500">
                        0{i + 1}
                      </div>
                      <span className="text-sm font-black uppercase italic tracking-tight">{sop.title}</span>
                    </div>
                    {activeSop === i ? <ChevronUp size={18} className="text-indigo-500" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </button>

                  {activeSop === i && (
                    <div className="px-6 pb-6 animate-in fade-in duration-300">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-4">
                        {sop.content}
                      </p>
                      <button
                        onClick={() => {
                          setSelectedProtocol(sop);
                          setShowProtocolModal(true);
                        }}
                        className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline"
                      >
                        Explore Full Protocol <ExternalLink size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Crisis Center Card (5 cols) */}
          <div className="lg:col-span-5 bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Emergency Intervention</h3>
                <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Technical Crisis Control Center</p>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                  <Phone className="text-white mb-2" size={20} />
                  <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest">Direct Priority Line</p>
                  <p className="text-lg font-black italic">+91 91 2345 6789</p>
                </div>

                <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                  <Mail className="text-white mb-2" size={20} />
                  <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest">Internal Intel Hub</p>
                  <p className="text-lg font-black italic">support@skilledustaad.com</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Protocol Intelligence Modal */}
      {showProtocolModal && selectedProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden relative">
            <div className="px-8 py-6 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="text-blue-500" size={22} />
                <h3 className="text-lg font-black uppercase tracking-tighter italic">Protocol Sequence Node</h3>
              </div>
              <button
                onClick={() => setShowProtocolModal(false)}
                className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl hover:text-rose-500"
              >
                <ShieldAlert size={18} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="p-5 bg-blue-600/5 rounded-2xl border border-blue-600/10">
                <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">{selectedProtocol.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">{selectedProtocol.content}</p>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Execution Sequence</p>
                {selectedProtocol.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-xs font-bold uppercase">
                    <span className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-500 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    {detail}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowProtocolModal(false)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl"
              >
                Close Protocol Node
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Support;
