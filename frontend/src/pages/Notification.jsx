import React, { useState } from "react";
import { 
  Bell, Mail, MessageSquare, Zap, Target, 
  Calendar, UserPlus, ShieldAlert, BellRing, 
  Settings2, Smartphone, Monitor, Info, CheckCircle 
} from "lucide-react";

/**
 * Premium Communication Control Center
 * Orchestrates all administrative and system notification nodes
 */
const Notification = () => {
  const [notifications, setNotifications] = useState({
    sms: true,
    email: true,
    push: true,
    priority: true,
    cancellations: true,
    bookings: true,
    signups: true,
  });

  const [lastUpdated, setLastUpdated] = useState(null);

  const toggleNotification = (type) => {
    setNotifications((prev) => ({ ...prev, [type]: !prev[type] }));
    setLastUpdated(type);
    setTimeout(() => setLastUpdated(null), 2000);
  };

  const ChannelGroup = ({ title, items }) => (
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-500 p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-50 dark:border-white/5 pb-4">
        <h3 className="text-gray-900 dark:text-white text-lg font-black tracking-tighter uppercase italic font-serif flex items-center gap-3">
          <Settings2 className="text-blue-500" size={20} />
          {title}
        </h3>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Global Node</span>
      </div>
      
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-white/[0.02] p-4 rounded-3xl transition-all duration-300">
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                notifications[item.key] 
                  ? "bg-blue-600/10 border-blue-500/20 text-blue-500 shadow-lg shadow-blue-500/5 rotate-3" 
                  : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 grayscale"
              }`}>
                {item.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-gray-900 dark:text-white text-sm font-black uppercase tracking-tight">{item.label}</h4>
                <p className="text-gray-500 text-[10px] font-medium leading-relaxed max-w-[200px]">{item.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {lastUpdated === item.key && (
                <CheckCircle size={14} className="text-emerald-500 animate-in zoom-in-50 duration-300" />
              )}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={() => toggleNotification(item.key)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 dark:bg-black/40 border border-gray-300 dark:border-white/10 peer-focus:outline-none rounded-full peer 
                  peer-checked:after:translate-x-6 peer-checked:after:bg-white after:content-[''] 
                  after:absolute after:top-[4px] after:left-[4px] after:bg-gray-400 dark:after:bg-gray-600 
                  after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 peer-checked:border-blue-500">
                </div>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                <BellRing className="text-blue-500" size={24} />
             </div>
             <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic font-serif">
               Communication <span className="text-blue-500 italic">Centers</span>
             </h2>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">Orchestrate Administrative Dispatch Nodes</p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 px-6 py-4 rounded-[2rem] shadow-sm backdrop-blur-xl">
           <Zap className="text-amber-500" size={18} />
           <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Global Sync Status</p>
              <p className="text-xs text-gray-900 dark:text-white font-black uppercase mt-1">Operational & Encrypted</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Delivery Channels */}
        <ChannelGroup 
          title="Delivery Channels" 
          items={[
            { 
              key: "push", 
              label: "Mobile Push", 
              icon: <Smartphone size={20} />,
              description: "Real-time critical alerts delivered directly to administrative mobile hardware."
            },
            { 
              key: "email", 
              label: "Secure Email", 
              icon: <Mail size={20} />,
              description: "Persistent documentation nodes for audit-ready event reporting and logs."
            },
            { 
              key: "sms", 
              label: "Direct SMS", 
              icon: <MessageSquare size={20} />,
              description: "High-priority carrier-level dispatch for immediate operational awareness."
            },
            { 
              key: "priority", 
              label: "System Monitor", 
              icon: <Monitor size={20} />,
              description: "Internal dashboard popups for active terminal monitoring sessions."
            },
          ]}
        />

        {/* System Trigger Events */}
        <ChannelGroup 
          title="Trigger Protocols" 
          items={[
            { 
              key: "bookings", 
              label: "Deployment Nodes", 
              icon: <Target size={20} />,
              description: "Triggers when a new service deployment request enters the dispatch queue."
            },
            { 
              key: "cancellations", 
              label: "Emergency Abort", 
              icon: <ShieldAlert size={20} />,
              description: "Immediate broadcast for service session terminations or provider aborts."
            },
            { 
              key: "signups", 
              label: "Registry Events", 
              icon: <UserPlus size={20} />,
              description: "Notification for new infrastructure stakeholders or administrative enrollments."
            },
          ]}
        />
      </div>

      {/* Advisory Note */}
      <div className="max-w-3xl bg-blue-600/5 dark:bg-blue-600/10 border border-blue-500/10 rounded-[2rem] p-6 flex gap-5 items-center">
         <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
            <Info size={24} />
         </div>
         <div className="space-y-1">
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Administrative Compliance Advisory</h4>
            <p className="text-[10px] text-gray-500 font-medium leading-relaxed uppercase tracking-tight">
               Notification changes are synced across all root nodes in real-time. Ensure dispatch protocols align with regional operational requirements to maintain service level agreements.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Notification;

