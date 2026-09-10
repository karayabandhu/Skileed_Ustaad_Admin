import React, { useState, useEffect } from "react";
import api from "../api";
import { 
  Settings as SettingsIcon, CreditCard, Globe, 
  ShieldCheck, Palette, Save, AlertTriangle, 
  RefreshCw, CheckCircle2, Lock, Eye, 
  Settings2, Percent, Clock, Languages,
  ChevronRight, HardDrive, Info, Power,
  Zap, Database
} from "lucide-react";

/**
 * Global Control & Configuration Terminal
 * Orchestrating platform-wide parameters and infrastructure settings
 */
const Settings = () => {
  const [activeTab, setActiveTab] = useState("financial");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState({
    taxAndCommission: {
      gst: "18%",
      serviceTax: "5%",
      commission: "10%",
    },
    localization: {
      language: "English (Global)",
      timezone: "Asia/Kolkata (GMT+5:30)",
      currency: "INR (₹)",
    },
    security: {
      mfaEnabled: true,
      sessionTimeout: "45 Minutes",
    },
    branding: {
      themeColor: "#2563eb",
      maintenanceMode: false,
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get("/settings");
      if (data) {
        setSettings({
          taxAndCommission: data.taxAndCommission || settings.taxAndCommission,
          localization: data.localization || settings.localization,
          security: data.security || settings.security,
          branding: data.branding || settings.branding
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/settings", settings);
      alert("Global Configuration Synchronized Across All Nodes.");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to synchronize configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleRotateKeys = async () => {
    try {
      await api.post("/admin/security/rotate-keys");
      alert("System Security Protocols Rotated & Vault Re-Locked.");
      fetchSettings();
    } catch (error) {
      console.error("Rotation failure:", error);
      alert("Vault Protocol Failure: Unable to rotate cluster keys.");
    }
  };

  const navItems = [
    { id: "financial", label: "Financial Hub", icon: <CreditCard size={18} /> },
    { id: "localization", label: "Regional Nodes", icon: <Globe size={18} /> },
    { id: "security", label: "Security Vault", icon: <ShieldCheck size={18} /> },
    { id: "branding", label: "Branding & UI", icon: <Palette size={18} /> },
  ];

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#020617]">
         <div className="flex flex-col items-center gap-4">
            <RefreshCw className="animate-spin text-blue-600" size={40} />
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Loading Registry...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 font-sans bg-[#f8fafc] dark:bg-[#020617] min-h-screen">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic font-serif">
            System <span className="text-blue-600 italic">Configuration</span>
          </h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">Orchestrating Global Platform Parameters</p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-6 py-4 rounded-[2rem] shadow-sm backdrop-blur-xl">
           <HardDrive className="text-blue-500" size={18} />
           <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Cluster Status</p>
              <p className="text-xs text-gray-900 dark:text-white font-black uppercase mt-1">Config Synced Hub-01</p>
           </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-3">
           {navItems.map((item) => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`group flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-300 ${
                 activeTab === item.id 
                   ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20" 
                   : "bg-white dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5"
               }`}
             >
                <div className="flex items-center gap-4">
                   <div className={`p-2.5 rounded-xl transition-all ${
                     activeTab === item.id ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:text-blue-500"
                   }`}>
                      {item.icon}
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                </div>
                <ChevronRight size={16} className={`transition-transform duration-300 ${activeTab === item.id ? "translate-x-1" : "text-gray-300"}`} />
             </button>
           ))}

           <div className="mt-6 p-6 sm:p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] sm:rounded-[2.5rem] space-y-4">
              <div className="flex items-center gap-3 text-amber-500">
                 <AlertTriangle size={18} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Global Warning</span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-tight">
                 Modifying configuration nodes will impact all service clusters globally. Deploy with caution.
              </p>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8 h-fit lg:min-h-[600px] flex flex-col">
           {/* Section Card */}
           <div className="bg-white dark:bg-[#0f172a] rounded-[2rem] sm:rounded-[3rem] border border-gray-200 dark:border-white/10 shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="p-6 sm:p-10 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20 shadow-inner">
                       {navItems.find(i => i.id === activeTab)?.icon}
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                          {navItems.find(i => i.id === activeTab)?.label}
                       </h3>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Core System Parameters</p>
                    </div>
                 </div>
                 
                 {activeTab === "branding" && (
                     <button 
                        onClick={() => setSettings({ ...settings, branding: { ...settings.branding, maintenanceMode: !settings.branding.maintenanceMode }})}
                        className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl group cursor-pointer transition-all border ${
                          settings.branding.maintenanceMode 
                            ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20" 
                            : "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white"
                        }`}
                     >
                        <Power size={14} className={settings.branding.maintenanceMode ? "text-white" : "text-rose-500 group-hover:text-white"} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Maintenance: {settings.branding.maintenanceMode ? "ON" : "OFF"}</span>
                     </button>
                  )}
              </div>

              <div className="p-6 sm:p-10 flex-1">
                 {activeTab === "financial" && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                      {[
                        { label: "Platform GST Registry", val: settings.taxAndCommission.gst, icon: <Percent size={14} />, key: "gst" },
                        { label: "Global Service Tax", val: settings.taxAndCommission.serviceTax, icon: <Zap size={14} />, key: "serviceTax" },
                        { label: "Admin Commission Node", val: settings.taxAndCommission.commission, icon: <Percent size={14} />, key: "commission" },
                        { label: "Payout Settlement Cycle", val: "Weekly (Sunday 23:59)", icon: <Clock size={14} />, key: "payout" },
                      ].map((field) => (
                        <div key={field.key} className="space-y-3">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                              {field.icon} {field.label}
                           </label>
                           <input 
                             value={field.val}
                             onChange={(e) => {
                               if (field.key === "payout") return;
                               setSettings({ 
                                 ...settings, 
                                 taxAndCommission: { ...settings.taxAndCommission, [field.key]: e.target.value } 
                               });
                             }}
                             className={`w-full p-5 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-blue-500/50 rounded-[1.5rem] text-sm font-bold text-gray-900 dark:text-white outline-none transition-all ${field.key === "payout" ? "cursor-not-allowed italic" : ""}`}
                             readOnly={field.key === "payout"}
                           />
                        </div>
                      ))}
                      <div className="md:col-span-2 p-6 sm:p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                               <RefreshCw size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Real-time Synchronization</p>
                               <p className="text-xs font-black text-emerald-600 dark:text-emerald-500 mt-1 uppercase">Financial updates reflect immediately on all provider nodes</p>
                            </div>
                         </div>
                      </div>
                   </div>
                 )}

                 {activeTab === "localization" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <Languages size={14} /> System Interface Language
                          </label>
                          <select 
                             value={settings.localization.language}
                             onChange={(e) => setSettings({ 
                               ...settings, 
                               localization: { ...settings.localization, language: e.target.value } 
                             })}
                             className="w-full p-5 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-blue-500/50 rounded-[1.5rem] text-sm font-bold text-gray-900 dark:text-white outline-none transition-all appearance-none cursor-pointer"
                          >
                             <option>English (Global)</option>
                             <option>Hindi (IN)</option>
                             <option>Spanish (ES)</option>
                             <option>French (FR)</option>
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <Clock size={14} /> Intelligence Cluster Timezone
                          </label>
                          <select 
                             value={settings.localization.timezone}
                             onChange={(e) => setSettings({ 
                               ...settings, 
                               localization: { ...settings.localization, timezone: e.target.value } 
                             })}
                             className="w-full p-5 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-blue-500/50 rounded-[1.5rem] text-sm font-bold text-gray-900 dark:text-white outline-none transition-all appearance-none cursor-pointer"
                          >
                             <option>Asia/Kolkata (GMT+5:30)</option>
                             <option>UTC (GMT+0:00)</option>
                             <option>America/New_York (GMT-5:00)</option>
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <Database size={14} /> Currency Node Symbol
                          </label>
                          <input 
                             value={settings.localization.currency}
                             className="w-full p-5 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-blue-500/50 rounded-[1.5rem] text-sm font-bold text-gray-900 dark:text-white outline-none transition-all cursor-not-allowed"
                             readOnly
                          />
                       </div>
                    </div>
                 )}

                 {activeTab === "security" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="p-6 sm:p-8 bg-gray-50 dark:bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-white/5 space-y-6">
                             <div className="flex items-center justify-between">
                                <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl">
                                   <Lock size={20} />
                                </div>
                                <div className="flex bg-gray-200 dark:bg-white/10 p-1 rounded-xl">
                                   <button 
                                     onClick={() => setSettings({ ...settings, security: { ...settings.security, mfaEnabled: true }})}
                                     className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${settings.security.mfaEnabled ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-gray-500"}`}
                                   >Enabled</button>
                                   <button 
                                     onClick={() => setSettings({ ...settings, security: { ...settings.security, mfaEnabled: false }})}
                                     className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!settings.security.mfaEnabled ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-gray-500"}`}
                                   >Disabled</button>
                                </div>
                             </div>
                             <div>
                                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Admin Multi-Factor Auth</h4>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Elevate node security access</p>
                             </div>
                          </div>

                          <div className="p-6 sm:p-8 bg-gray-50 dark:bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-white/5 space-y-6">
                             <div className="flex items-center justify-between">
                                <div className="p-3 bg-indigo-600/10 text-indigo-500 rounded-2xl">
                                   <Eye size={20} />
                                </div>
                                <input 
                                  value={settings.security.sessionTimeout}
                                  onChange={(e) => setSettings({ ...settings, security: { ...settings.security, sessionTimeout: e.target.value }})}
                                  className="text-sm font-black text-gray-900 dark:text-white italic tracking-tighter bg-transparent border-none outline-none text-right w-20"
                                />
                             </div>
                             <div>
                                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Console Session Timeout</h4>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Automatic session destruction</p>
                             </div>
                          </div>
                       </div>

                       <div 
                           onClick={handleRotateKeys}
                           className="p-6 sm:p-8 bg-rose-500/5 border border-rose-500/10 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-between group cursor-pointer hover:bg-rose-500/10 transition-all"
                        >
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                                 <RefreshCw size={20} />
                              </div>
                              <div>
                                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Security Key Rotation</p>
                                 <p className="text-xs font-black text-rose-600 dark:text-rose-500 mt-1 uppercase">Cycle all API keys and secondary auth nodes</p>
                                 {settings.security.lastRotationAt && (
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mt-1 italic">Last Rotated: {new Date(settings.security.lastRotationAt).toLocaleString()}</p>
                                 )}
                              </div>
                           </div>
                           <ChevronRight size={18} className="text-rose-500 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                 )}

                 {activeTab === "branding" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Universal Accent Node</label>
                          <div className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-gray-200 dark:border-white/5">
                             <div 
                                className="w-10 h-10 rounded-xl shadow-xl transition-all cursor-pointer border border-white/10" 
                                style={{ backgroundColor: settings.branding.themeColor }}
                                onClick={() => document.getElementById('theme-color-input')?.click()}
                             ></div>
                             <input 
                               value={settings.branding.themeColor}
                               onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, themeColor: e.target.value }})}
                               className="flex-1 text-xs font-bold text-gray-900 dark:text-white font-mono uppercase tracking-widest bg-transparent border-none outline-none"
                             />
                             <input 
                                type="color"
                                id="theme-color-input"
                                className="hidden"
                                value={settings.branding.themeColor}
                                onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, themeColor: e.target.value.toUpperCase() }})}
                             />
                             <button 
                                onClick={() => document.getElementById('theme-color-input')?.click()}
                                className="p-2.5 bg-white dark:bg-white/10 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                             >
                                <Palette size={16} />
                             </button>
                          </div>
                       </div>
                       <button 
                          onClick={() => setSettings({ ...settings, branding: { ...settings.branding, maintenanceMode: !settings.branding.maintenanceMode }})}
                          className={`space-y-4 text-center flex flex-col items-center justify-center p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border transition-all cursor-pointer ${settings.branding.maintenanceMode ? "bg-rose-500/10 border-rose-500 shadow-lg shadow-rose-500/10" : "bg-gray-50 dark:bg-white/5 border-dashed border-gray-300 dark:border-white/10 hover:border-blue-500/50"}`}
                       >
                          <div className={`p-4 rounded-full mb-2 ${settings.branding.maintenanceMode ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-blue-600/10 text-blue-500"}`}>
                             <Power size={24} />
                          </div>
                          <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Maintenance Mode: {settings.branding.maintenanceMode ? "ACTIVE" : "OFF"}</h4>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{settings.branding.maintenanceMode ? "Platform accessibility restricted" : "Platform globally accessible"}</p>
                       </button>
                    </div>
                 )}
              </div>

              {/* Action Bar */}
              <div className="p-6 sm:p-8 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 text-center sm:text-left">
                 <div className="flex items-center gap-3">
                    <Info size={16} className="text-gray-400" />
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Registry Version: KM-ADMIN-v2.0.4 - Stable</p>
                 </div>
                 <button 
                   onClick={handleSave}
                   disabled={loading}
                   className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center gap-3 disabled:opacity-70"
                 >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    {loading ? "Synchronizing..." : "Commit Configuration"}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
