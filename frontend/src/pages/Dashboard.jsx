import React, { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Briefcase, DollarSign, CheckCircle, Plus, Filter, ArrowUpRight, ArrowDownRight, MoreVertical, Search, MapPin, Calendar, Clock, Image as ImageIcon, X, Gavel } from "lucide-react";
import axios from "axios";
import { JobContext } from "../context/jobContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import io from "socket.io-client";
import api from "../api";
import { useSocket } from "../context/SocketContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { on } = useSocket();
  const { addJob, jobs, fetchJobs } = useContext(JobContext);
  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    providerSubService: "",
    subService: "",
    description: "",
    requirement: "",
    imageUrl: "",
    imageFile: null,
    basePrice: "",
    discount: "",
    price: "",
    cities: [],
    cityInput: "",
    serviceType: "normal",
  });
  const [statsSummary, setStatsSummary] = useState({
    customerCount: 0,
    providerCount: 0,
    totalJobsCount: 0,
    totalRevenue: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [revenuePeriod, setRevenuePeriod] = useState("live");
  const [revenueData, setRevenueData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [activeMenu, setActiveMenu] = useState(null);

  const towns = [
    "New Delhi","Mumbai","Bengaluru","Kolkata","Chennai","Hyderabad","Pune",
    "Ahmedabad","Jaipur","Lucknow","Kanpur","Nagpur","Indore","Thane","Bhopal",
    "Visakhapatnam","Pimpri-Chinchwad","Patna","Purnea","Vadodara","Ghaziabad","Ludhiana",
    "Agra","Nashik","Faridabad","Meerut","Rajkot","Kalyan-Dombivli","Vasai-Virar",
    "Varanasi","Srinagar","Dhanbad","Jodhpur","Amritsar","Raipur","Allahabad",
    "Ranchi","Howrah","Coimbatore","Jabalpur","Gwalior","Vijayawada","Madurai",
    "Kota","Bareilly","Noida","Gurugram","Moradabad","Aligarh","Tiruchirappalli"
  ];

  // Analytics & Operational Pulse
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get("/stats");
        if (res.data?.success) {
          setStatsSummary(res.data.stats);
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };

    const fetchRecentActivity = async () => {
      try {
        const res = await api.get("/notifications/list");
        if (res.data?.success) {
          setRecentActivity(res.data.notifications.slice(0, 5));
        }
      } catch (err) {
        console.error("Error fetching activity:", err);
      }
    };
    
    fetchDashboardStats();
    fetchRecentActivity();
    fetchRevenueData();
    fetchJobs();

    // Socket Listeners using the reliable Context 'on'
    const unsubStats = on("dashboardStats", (stats) => setStatsSummary(stats));
    const unsubTx = on("transactionUpdated", () => {
       fetchDashboardStats();
       fetchRevenueData();
    });
    const unsubNotif = on("admin_notification", (newNotif) => {
      setRecentActivity(prev => [newNotif, ...prev].slice(0, 5));
    });

    return () => {
      unsubStats();
      unsubTx();
      unsubNotif();
    };
  }, [revenuePeriod, on]); // Depend on 'on' from useSocket

  useEffect(() => {
    const refresh = () => fetchJobs();
    const unsubJobAdd = on("jobAdded", refresh);
    const unsubJobUpd = on("jobUpdated", refresh);
    const unsubJobDel = on("jobDeleted", refresh);
    
    return () => {
      unsubJobAdd();
      unsubJobUpd();
      unsubJobDel();
    };
  }, [fetchJobs, on]);

  async function fetchRevenueData() {
    try {
      const res = await api.get(`/revenue?period=${revenuePeriod}`);
      if (res.data?.success) {
        setRevenueData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching revenue data:", err);
    }
  }

  const handleAddCity = (city) => {
    if (!city?.trim()) return;
    setFormData((prev) => ({
      ...prev,
      cities: Array.from(new Set([...(prev.cities || []), city.trim()])),
      cityInput: "",
    }));
  };

  const handleRemoveCity = (city) => {
    setFormData((prev) => ({ ...prev, cities: prev.cities.filter((c) => c !== city) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { category, providerSubService, subService, description, requirement, imageUrl, basePrice, discount, price, cities, cityInput, serviceType } = formData;

    const numBase = Number(basePrice || price || 0);
    const numDiscount = Number(discount || 0);

    if (!category || !subService || !description || (serviceType === "normal" && !numBase)) {
      alert("Please fill all required fields!");
      return;
    }

    const numFinal = numDiscount > 0 ? Math.round(numBase - (numBase * numDiscount / 100)) : numBase;

    const cityList = cities.length ? cities : (cityInput ? [cityInput] : []);
    const data = new FormData();
    data.append("category", category);
    data.append("providerSubService", providerSubService);
    data.append("subService", subService);
    data.append("description", description);
    data.append("requirement", requirement);
    if (formData.imageFile) {
      data.append("image", formData.imageFile);
    } else if (imageUrl) {
      data.append("imageUrl", imageUrl);
    }
    data.append("basePrice", numBase);
    data.append("discount", numDiscount);
    data.append("price", numFinal);
    data.append("cities", JSON.stringify(cityList));
    data.append("city", cityList[0] || "");
    data.append("serviceType", serviceType);

    try {
      await addJob(data);
      setShowPopup(false);
      setFormData({ category: "", providerSubService: "", subService: "", description: "", requirement: "", imageUrl: "", imageFile: null, basePrice: "", discount: "", price: "", cities: [], cityInput: "", serviceType: "normal" });
      fetchJobs();
    } catch (err) {
      console.error("Error adding service:", err);
      alert("Failed to add service!");
    }
  };

  const safeJobs = (Array.isArray(jobs) ? jobs : []).filter(j => {
    const matchesSearch = 
      (j.subService || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.category || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || j.category === filterCategory;
    return matchesSearch && matchesCategory;
  });
  const categories = ["All", ...new Set((Array.isArray(jobs) ? jobs : []).map(j => j.category))];
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(safeJobs.length / PAGE_SIZE));
  const paginatedJobs = safeJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const trends = statsSummary.trends || {};
  const handleDownloadReport = async (title) => {
    try {
      setActiveMenu(null);
      let data = [];
      let filename = "";
      let headers = [];

      if (title === "Total Customers") {
        const res = await api.get("/customers?limit=1000");
        const rawData = res.data?.customers || (Array.isArray(res.data) ? res.data : []);
        filename = `customers_report_${new Date().toISOString().slice(0, 10)}.csv`;
        headers = ["ID", "Name", "Phone", "Email", "Status", "Wallet Balance", "Joined Date"];
        data = rawData.map(c => [
          c._id,
          c.name || "N/A",
          c.phone || "N/A",
          c.email || "N/A",
          c.status || "N/A",
          c.walletBalance || 0,
          new Date(c.createdAt).toLocaleDateString()
        ]);
      } else if (title === "Total Providers") {
        const res = await api.get("/providers?limit=1000");
        const rawData = res.data?.providers || (Array.isArray(res.data) ? res.data : []);
        filename = `providers_report_${new Date().toISOString().slice(0, 10)}.csv`;
        headers = ["ID", "Name", "Phone", "Category", "Status", "Rating", "Joined Date"];
        data = rawData.map(p => [
          p._id,
          p.fullName || "N/A",
          p.phoneNumber || "N/A",
          p.serviceCategory || "N/A",
          p.status || "N/A",
          p.rating || 0,
          new Date(p.createdAt).toLocaleDateString()
        ]);
      } else if (title === "Active Jobs") {
        const res = await api.get("/v1/admin/bookings?limit=1000");
        const rawData = res.data?.bookings || (Array.isArray(res.data) ? res.data : []);
        filename = `active_jobs_report_${new Date().toISOString().slice(0, 10)}.csv`;
        headers = ["ID", "Customer", "Service", "Status", "Price", "Date", "Time"];
        data = rawData.map(b => [
          b._id,
          b.customerName || "N/A",
          b.serviceName || "N/A",
          b.status || "N/A",
          b.totalPrice || 0,
          new Date(b.date).toLocaleDateString(),
          b.time || "N/A"
        ]);
      } else if (title === "Total Revenue") {
        const res = await api.get("/finance");
        const rawData = Array.isArray(res.data) ? res.data : [];
        filename = `revenue_report_${new Date().toISOString().slice(0, 10)}.csv`;
        headers = ["Transaction ID", "User", "Provider", "Amount", "Status", "Date"];
        data = rawData.map(t => [
          t.transactionId || t._id,
          t.userName || "N/A",
          t.providerName || "N/A",
          t.amount || 0,
          t.status || "N/A",
          new Date(t.date).toLocaleDateString()
        ]);
      }

      if (data.length === 0) {
        alert("No data available to download.");
        return;
      }

      const csvContent = [
        headers.join(","),
        ...data.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to generate report. Please try again.");
    }
  };

  const stats = [
    { 
      title: "Total Customers", 
      value: statsSummary.customerCount, 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-50 dark:bg-blue-900/20", 
      trend: trends.customer || "0%", 
      trendUp: !(trends.customer?.startsWith("-")),
      link: "/users"
    },
    { 
      title: "Total Providers", 
      value: statsSummary.providerCount, 
      icon: CheckCircle, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50 dark:bg-emerald-900/20", 
      trend: trends.provider || "0%", 
      trendUp: !(trends.provider?.startsWith("-")),
      link: "/providers"
    },
    { 
      title: "Active Jobs", 
      value: statsSummary.totalJobsCount, 
      icon: Briefcase, 
      color: "text-orange-600", 
      bg: "bg-orange-50 dark:bg-orange-900/20", 
      trend: trends.job || "0%", 
      trendUp: !(trends.job?.startsWith("-")),
      link: "/jobs"
    },
    { 
      title: "Total Revenue", 
      value: `₹${statsSummary.totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: "text-purple-600", 
      bg: "bg-purple-50 dark:bg-purple-900/20", 
      trend: trends.revenue || "0%", 
      trendUp: !(trends.revenue?.startsWith("-")),
      link: "/finance"
    },
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time performance and system status</p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all w-full md:w-64"
            />
          </div>
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all appearance-none cursor-pointer w-full"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button 
            onClick={() => { setFormData({ ...formData, serviceType: "normal" }); setShowPopup(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all whitespace-nowrap"
          >
            <Plus size={16} /> Normal
          </button>
          <button 
            onClick={() => { setFormData({ ...formData, serviceType: "bidding" }); setShowPopup(true); }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all whitespace-nowrap"
          >
            <Gavel size={16} /> Bidding
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="relative group bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`p-3 rounded-xl w-fit mb-4 ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.title}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
                <span className={`flex items-center text-xs font-bold ${stat.trendUp ? "text-emerald-500" : "text-rose-500"}`}>
                  {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.trend}
                </span>
              </div>
            </div>
            <div className="absolute top-4 right-4 group">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === i ? null : i); }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all text-gray-300 hover:text-gray-500"
              >
                <MoreVertical size={18} />
              </button>
              
              {activeMenu === i && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                      onClick={() => navigate(stat.link)}
                      className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-between"
                    >
                      View Details
                      <ArrowUpRight size={14} className="text-blue-500" />
                    </button>
                    <button 
                      onClick={() => handleDownloadReport(stat.title)}
                      className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      Download Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Growth</h2>
              <p className="text-sm text-gray-500">Weekly automated simulation</p>
            </div>
            <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-lg">
              <button 
                onClick={() => setRevenuePeriod("live")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${revenuePeriod === "live" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500"}`}
              >
                Live
              </button>
              <button 
                onClick={() => setRevenuePeriod("past")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${revenuePeriod === "past" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500"}`}
              >
                Past
              </button>
            </div>
          </div>
          <div className="h-[300px] md:h-80 w-full group/chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  tickFormatter={(v) => `₹${v/1000}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4'}} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Side Activity (Connected) */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Clock size={32} className="mb-2 opacity-20" />
                <p className="text-sm font-medium">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity, i) => {
                const isSystem = activity.type === "system_alert";
                const isBooking = activity.type === "new_booking";
                const isProvider = activity.type === "new_provider";
                const isCustomer = activity.type === "new_customer";
                const isPayout = activity.type === "payout_request";
                const handleActivityClick = (activity) => {
                  const type = activity.type?.toLowerCase() || "";
                  const title = activity.title?.toLowerCase() || "";
                  const message = activity.message?.toLowerCase() || "";
                  const metadata = activity.metadata || {};

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
                    navigate("/notification");
                  }
                };

                return (
                  <div 
                    key={activity.id || i} 
                    onClick={() => handleActivityClick(activity)}
                    className="flex gap-4 group/item cursor-pointer p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover/item:scale-110 ${
                      isBooking ? "bg-blue-50 text-blue-600" :
                      isProvider ? "bg-emerald-50 text-emerald-600" :
                      isCustomer ? "bg-purple-50 text-purple-600" :
                      isPayout ? "bg-amber-50 text-amber-600" :
                      "bg-gray-50 text-gray-600"
                    }`}>
                      {isBooking ? <Briefcase size={18} /> :
                       isProvider ? <Users size={18} /> : 
                       isCustomer ? <Plus size={18} /> :
                       isPayout ? <DollarSign size={18} /> :
                       <Clock size={18} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover/item:text-blue-600 transition-colors">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{activity.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <button 
            onClick={() => navigate("/notification")}
            className="w-full mt-8 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
          >
            View All Notifications
          </button>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white dark:bg-gray-900 p-4 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Service Catalogue</h2>
            <p className="text-sm text-gray-500">Manage and monitor all platform offerings</p>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-gray-700 dark:text-white uppercase tracking-widest mr-2">Page {page} / {totalPages}</span>
             <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => setPage(p => Math.max(1, p-1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-700 dark:text-white"
                >
                  <ArrowDownRight className="rotate-135" size={16} />
                </button>
                <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p+1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-700 dark:text-white"
                >
                  <ArrowUpRight className="rotate-45" size={16} />
                </button>
             </div>
          </div>
        </div>

        {safeJobs.length === 0 ? (
          <div className="py-20 text-center">
            <div className="flex justify-center mb-4 text-gray-200"><Briefcase size={64} /></div>
            <p className="text-gray-400 font-medium">No services found in the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedJobs.map((service) => (
              <div key={service._id} className="group bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-transparent hover:border-blue-500/30 hover:bg-white dark:hover:bg-gray-800 shadow-none hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={service.imageUrl ? (service.imageUrl.startsWith('http') ? service.imageUrl : `${import.meta.env.VITE_API_URL.replace('/api', '')}${service.imageUrl}`) : "https://images.unsplash.com/photo-1581578731548-c64695cc6954?auto=format&fit=crop&q=80"} 
                    alt={service.category} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-600 shadow-sm flex items-center gap-1.5">
                    {service.discount > 0 && service.basePrice > service.price ? (
                      <>
                        <span className="line-through text-gray-400 text-[10px]">₹{service.basePrice?.toLocaleString()}</span>
                        <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black">{service.discount}% OFF</span>
                        <span>₹{service.price?.toLocaleString()}</span>
                      </>
                    ) : (
                      <span>₹{service.price?.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <span className="text-white text-xs font-bold uppercase tracking-wider bg-blue-600 px-2 py-0.5 rounded">
                      {service.category}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{service.subService}</h3>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">{service.description}</p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <MapPin size={14} className="text-blue-500" />
                      <span className="truncate">{service.cities?.join(", ") || service.city || "Pan India"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                         <Calendar size={12} />
                         <span>{new Date(service.date).toLocaleDateString()}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded italic">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Add Service Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowPopup(false)}></div>
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Add <span className={formData.serviceType === 'bidding' ? 'text-amber-500' : 'text-blue-600'}>
                    {formData.serviceType === 'bidding' ? 'Bidding' : 'Normal'} Service
                  </span>
                </h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Configure service parameters</p>
              </div>
              <button 
                onClick={() => setShowPopup(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Service Type Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl w-full border border-gray-200 dark:border-gray-700">
                {["normal", "bidding"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, serviceType: type })}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                      formData.serviceType === type
                        ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {type} Service
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Service Sector (Level 1)</label>
                  <input
                    type="text"
                    placeholder="e.g. Home Services"
                    list="sector-suggestions"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    required
                  />
                  <datalist id="sector-suggestions">
                    <option value="Home Services" />
                    <option value="Professional Works" />
                    <option value="Digital Works" />
                    <option value="Emergency service" />
                    <option value="Per day Services" />
                    <option value="Medical Helpers" />
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Expert Trade (Level 2)</label>
                  <input
                    type="text"
                    placeholder="e.g. Electrician"
                    value={formData.providerSubService}
                    onChange={(e) => setFormData({ ...formData, providerSubService: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Specific Task Name (Level 3)</label>
                <input
                  type="text"
                  placeholder="e.g. TV Repair / Fan Installation"
                  value={formData.subService}
                  onChange={(e) => setFormData({ ...formData, subService: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Tell us about this service..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Special Requirements (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Specify any special tools or requirements..."
                  value={formData.requirement}
                  onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Service Image</label>
                <div className="relative group/upload">
                  <div 
                    onClick={() => document.getElementById('image-upload').click()}
                    className={`cursor-pointer w-full bg-gray-50 dark:bg-gray-800 border-2 border-dashed ${formData.imageFile ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-gray-200 dark:border-gray-700'} hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center py-6 transition-all duration-300 overflow-hidden relative`}
                  >
                    {formData.imageFile ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="text-emerald-500 mb-2" size={24} />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formData.imageFile.name}</span>
                        <span className="text-[10px] text-gray-500 mt-1 uppercase">Click to change</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <ImageIcon className="text-gray-400 mb-2" size={24} />
                        <span className="text-xs font-bold text-gray-500">Upload from Gallery</span>
                        <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, WEBP (Max 5MB)</span>
                      </div>
                    )}
                    
                    {/* Hidden File Input */}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, imageFile: e.target.files[0] })}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {formData.serviceType === "normal" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Base Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="1000"
                        value={formData.basePrice !== "" ? formData.basePrice : formData.price}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => {
                            const base = Number(val || 0);
                            const disc = Number(prev.discount || 0);
                            const finalP = disc > 0 ? Math.round(base - (base * disc / 100)) : base;
                            return { ...prev, basePrice: val, price: finalP };
                          });
                        }}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white font-bold"
                        required={formData.serviceType === "normal"}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={formData.discount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => {
                            const disc = Number(val || 0);
                            const base = Number(prev.basePrice !== "" ? prev.basePrice : prev.price || 0);
                            const finalP = disc > 0 ? Math.round(base - (base * disc / 100)) : base;
                            return { ...prev, discount: val, price: finalP };
                          });
                        }}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white font-bold"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3.5 rounded-2xl flex items-center justify-between border border-blue-100 dark:border-blue-800/50">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Our Final Customer Price</span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                      ₹{formData.basePrice !== "" ? (formData.discount > 0 ? Math.round(Number(formData.basePrice || 0) * (1 - Number(formData.discount || 0)/100)) : Number(formData.basePrice || 0)) : (formData.price || 0)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Service Locations</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      value={formData.cityInput}
                      onChange={(e) => setFormData({ ...formData, cityInput: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault() || handleAddCity(formData.cityInput))}
                      placeholder="Add cities..."
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      list="town-suggestions"
                    />
                    <datalist id="town-suggestions">
                      {towns.map(t => <option key={t} value={t} />)}
                    </datalist>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddCity(formData.cityInput)}
                    className="px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.cities.map(city => (
                    <span key={city} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800/50">
                      {city}
                      <button type="button" onClick={() => handleRemoveCity(city)} className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm tracking-widest uppercase shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Launch Service
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

