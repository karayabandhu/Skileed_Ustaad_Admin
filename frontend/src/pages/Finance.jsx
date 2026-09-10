import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSocket } from "../context/SocketContext";
import { DollarSign, CheckCircle, XCircle, Clock, Download, FileText, Filter, ArrowUpRight, ArrowDownRight, MoreHorizontal, Search, Wallet, TrendingUp, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import api from "../api";

const Finance = () => {
  const { on } = useSocket();
  const [transactions, setTransactions] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);

  // Pagination & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const itemsPerPage = 8;

  // Fetch all transactions
  const fetchTransactions = async () => {
    try {
      const res = await api.get("/finance");
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  // Fetch total revenue
  const fetchTotalRevenue = async () => {
    try {
      const res = await api.get("/finance/total");
      setTotalRevenue(res.data.total);
    } catch (err) {
      console.error("Error fetching revenue:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchTotalRevenue();

    const unsubTx = on("newTransaction", (data) => {
      setTransactions((prev) => [data, ...prev]);
      fetchTotalRevenue();
    });

    const unsubUpd = on("transactionUpdated", () => {
      fetchTransactions();
      fetchTotalRevenue();
    });

    return () => {
      unsubTx();
      unsubUpd();
    };
  }, [on]);

  // Process data for chart
  useEffect(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const grouped = {};

    // Initialize all months to 0 to ensure a smooth graph
    monthNames.forEach(m => grouped[m] = 0);

    transactions.forEach((t) => {
      if (!t.date || t.status?.toLowerCase() !== "completed") return;
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;

      // Filter by selected year
      if (d.getFullYear() !== selectedYear) return;

      const month = d.toLocaleString("default", { month: "short" });
      if (grouped.hasOwnProperty(month)) {
        grouped[month] += Number(t.amount || 0);
      }
    });

    const formattedData = monthNames.map(month => ({
      month,
      revenue: grouped[month]
    }));

    setMonthlyData(formattedData);
  }, [transactions]);

  // Export to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) return alert("No transactions to export");

    const headers = ["ID", "User", "Provider", "Type", "Amount", "Status", "Date"];
    const rows = transactions.map(t => [
      t.transactionId || t._id,
      t.userName || "N/A",
      t.providerName || "N/A",
      t.type || "booking",
      t.amount,
      t.status,
      new Date(t.date).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transaction_report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Professional Print-Ready Financial Report
  const handleGenerateReport = () => {
    if (transactions.length === 0) return alert("No data available for report generation.");

    const reportWindow = window.open("", "_blank");
    const today = new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Report - ${today}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #2563eb; padding-bottom: 20px; margin-bottom: 40px; }
          .logo { font-weight: 900; font-size: 24px; text-transform: uppercase; letter-spacing: -1px; }
          .logo span { color: #2563eb; }
          .report-title { text-align: right; }
          .report-title h1 { margin: 0; font-size: 20px; text-transform: uppercase; }
          .report-title p { margin: 5px 0 0; font-size: 12px; color: #64748b; font-weight: bold; }
          
          .summary-grid { display: grid; grid-cols: 3; display: flex; gap: 20px; margin-bottom: 40px; }
          .stat-card { flex: 1; padding: 20px; background: #f8fafc; border-radius: 15px; border: 1px solid #e2e8f0; }
          .stat-card p { margin: 0; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 1px; }
          .stat-card h2 { margin: 10px 0 0; font-size: 24px; font-weight: 900; color: #0f172a; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; background: #f1f5f9; padding: 12px 15px; font-size: 10px; text-transform: uppercase; font-weight: 800; border-bottom: 2px solid #e2e8f0; }
          td { padding: 12px 15px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
          .status { font-weight: bold; text-transform: uppercase; font-size: 10px; padding: 4px 8px; border-radius: 4px; }
          .status-completed { background: #dcfce7; color: #166534; }
          .status-pending { background: #fef9c3; color: #854d0e; }
          .status-failed { background: #fee2e2; color: #991b1b; }
          
          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
          @media print { .no-print { display: none; } }
          .print-btn { position: fixed; bottom: 20px; right: 20px; background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(37,99,235,0.3); }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">Download as PDF / Print</button>
        <div class="header">
          <div class="logo">SKILLED<span>USTAAD</span></div>
          <div class="report-title">
            <h1>Financial Statement</h1>
            <p>Report ID: #KB-${Date.now().toString().slice(-6)}</p>
            <p>Period Ending: ${today}</p>
          </div>
        </div>

        <div class="summary-grid">
          <div class="stat-card">
            <p>Total Revenue</p>
            <h2>₹${totalRevenue.toLocaleString()}</h2>
          </div>
          <div class="stat-card">
            <p>Avg Transaction</p>
            <h2>₹${transactions.length ? (totalRevenue / transactions.length).toFixed(0) : 0}</h2>
          </div>
          <div class="stat-card">
            <p>Settlements</p>
            <h2>${transactions.filter(t => t.status === "Completed").length}</h2>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Reference ID</th>
              <th>Source / Client</th>
              <th>Provider Node</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Execution Date</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.slice(0, 50).map(t => `
              <tr>
                <td>#${t.transactionId || t._id.slice(-8)}</td>
                <td>${t.userName || "N/A"}</td>
                <td>${t.providerName || "N/A"}</td>
                <td><strong>₹${t.amount?.toLocaleString()}</strong></td>
                <td><span class="status status-${(t.status || 'pending').toLowerCase()}">${t.status}</span></td>
                <td>${new Date(t.date).toLocaleDateString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>CONFIDENTIAL DOCUMENT - FOR ADMINISTRATIVE USE ONLY</p>
          <p>© ${new Date().getFullYear()} Skilled Ustaad Platform. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  const stats = [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", trend: "+24.5%", trendUp: true },
    { title: "Avg. Transaction", value: `₹${transactions.length ? (totalRevenue / transactions.length).toFixed(0) : 0}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", trend: "+8.2%", trendUp: true },
    { title: "Payouts Processed", value: transactions.filter(t => t.status === "Completed").length, icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", trend: "+12", trendUp: true },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-xl rounded-lg">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{label}</p>
          <p className="text-blue-600 dark:text-blue-400 font-semibold">₹ {payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Insights</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor transactions, revenue, and settlements</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-600 dark:text-gray-300 active:scale-95"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all font-medium text-sm active:scale-95"
          >
            <FileText size={16} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="group bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className={`flex items-center text-xs font-bold ${stat.trendUp ? "text-emerald-500" : "text-rose-500"}`}>
                {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.title}</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Analysis</h2>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowYearFilter(!showYearFilter)}
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${showYearFilter ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-gray-400"}`}
                >
                  <Filter size={18} />
                </button>

                {showYearFilter && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowYearFilter(false)}></div>
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700 mb-1">Filter by Year</p>
                      {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <button
                          key={year}
                          onClick={() => {
                            setSelectedYear(year);
                            setShowYearFilter(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-between ${selectedYear === year
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                        >
                          {year}
                          {selectedYear === year && <CheckCircle size={14} />}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          // Logic to reset or show all if needed, but for now just clear filter isn't applicable to "Year"
                          setSelectedYear(new Date().getFullYear());
                          setShowYearFilter(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-rose-500 uppercase tracking-tighter mt-1 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-colors"
                      >
                        Reset to Current
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400"><MoreHorizontal size={18} /></button>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Summary / Live Feed */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Payment Overview</h2>
          <div className="space-y-6 flex-1">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600"><CheckCircle size={20} /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Completed</p>
                  <p className="text-xs text-gray-500">Succesful settlements</p>
                </div>
              </div>
              <span className="text-lg font-bold text-emerald-500">{transactions.filter(t => t.status === "Completed").length}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600"><Clock size={20} /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Pending</p>
                  <p className="text-xs text-gray-500">Awaiting clearance</p>
                </div>
              </div>
              <span className="text-lg font-bold text-yellow-500">{transactions.filter(t => t.status === "Pending").length}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600"><XCircle size={20} /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Failed</p>
                  <p className="text-xs text-gray-500">Unsuccessful attempts</p>
                </div>
              </div>
              <span className="text-lg font-bold text-rose-500">{transactions.filter(t => t.status === "Failed").length}</span>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus(filterStatus === "Disputed" ? "All" : "Disputed")}
            className={`w-full mt-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${filterStatus === "Disputed" ? "bg-blue-600 text-white shadow-lg" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-white"}`}
          >
            {filterStatus === "Disputed" ? "Showing Disputed" : "Resolve Disputes"}
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Recent Transactions</h2>
          <div className="flex items-center gap-2">
            {filterStatus !== "All" && (
              <button onClick={() => setFilterStatus("All")} className="text-[10px] font-black uppercase text-rose-500 underline">Reset Filter</button>
            )}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 uppercase font-black" size={14} />
              <input
                type="text"
                placeholder="Search Transaction ID or Name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium dark:text-white"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 tracking-widest italic font-serif">
              <tr>
                <th className="px-8 py-4">Status</th>
                <th className="px-4 py-4">Intel Source</th>
                <th className="px-4 py-4">Transaction Details</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(() => {
                const filtered = transactions.filter(t => {
                  const matchesSearch =
                    t.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.providerName?.toLowerCase().includes(searchTerm.toLowerCase());

                  const matchesStatus = filterStatus === "All" ||
                    (filterStatus === "Disputed" ? (t.status === "Failed" || t.status === "Pending") : t.status === filterStatus);

                  return matchesSearch && matchesStatus;
                });

                const totalPages = Math.ceil(filtered.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

                if (paginatedData.length === 0) {
                  return (
                    <tr>
                      <td colSpan="7" className="px-8 py-10 text-center text-gray-500 font-medium italic">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  );
                }

                return (
                  <>
                    {paginatedData.map((t) => (
                      <tr key={t._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                        <td className="px-8 py-4">
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider italic font-serif ${t.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" :
                              t.status === "Pending" ? "bg-yellow-500/10 text-yellow-500" : "bg-rose-500/10 text-rose-500"
                            }`}>
                            {t.status === "Completed" ? <CheckCircle size={10} /> : t.status === "Pending" ? <Clock size={10} /> : <XCircle size={10} />}
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-black text-gray-900 dark:text-white uppercase group-hover:text-blue-500 transition-colors">{t.userName || "N/A"}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tighter">#{t.transactionId}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">{t.providerName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${t.type === 'wallet' ? 'bg-blue-600/10 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                            {t.type || 'booking'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-sm font-black italic ${t.type === 'wallet' ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>₹{t.amount?.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-4 text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                          {new Date(t.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedTransaction(t);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 group-hover:text-blue-500"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Pagination Controls inside a row to maintain layout */}
                    <tr>
                      <td colSpan="7" className="px-8 py-4 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic font-serif">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                            >
                              <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
                            </button>

                            <div className="flex items-center gap-1">
                              {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                // Basic logic to show limited page numbers if there are too many
                                if (totalPages > 5) {
                                  if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                                    if (Math.abs(page - currentPage) === 2) return <span key={page} className="text-gray-400">...</span>;
                                    return null;
                                  }
                                }
                                return (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === page
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                        : "hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-white"
                                      }`}
                                  >
                                    {page}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages || totalPages === 0}
                              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                            >
                              <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Transaction Audit</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider italic ${selectedTransaction.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" :
                      selectedTransaction.status === "Pending" ? "bg-yellow-500/10 text-yellow-500" : "bg-rose-500/10 text-rose-500"
                    }`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payload Value</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white italic">₹{selectedTransaction.amount?.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Participant: User</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{selectedTransaction.userName || "System"}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Participant: Provider</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{selectedTransaction.providerName || "Platform"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Type</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase italic">{selectedTransaction.type || "Booking"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference ID</span>
                  <span className="text-xs font-mono font-bold text-blue-500 uppercase">#{selectedTransaction.transactionId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cycle Timestamp</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{new Date(selectedTransaction.date).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  Close Audit Node
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
