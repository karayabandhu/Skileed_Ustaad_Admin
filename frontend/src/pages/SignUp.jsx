import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, Shield, ArrowLeft, Loader2, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import api from "../api";

/**
 * Premium Admin Registration Page
 * Designed for initializing new administrative node access
 */
const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (message, type = "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showFeedback("Core credentials (email/password) are mandatory.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/signup", { email, password, role: "admin" });
      const data = res.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));
      showFeedback("Administrative account initialized successfully", "success");
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/");
        window.location.reload(); // Refresh to update auth state in App.jsx
      }, 1000);
    } catch (error) {
      console.error("Signup Error:", error);
      showFeedback(error.response?.data?.message || "Account initialization failed. Contact system root.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-lg p-6 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Back Navigation */}
        <button 
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Terminal
        </button>

        {/* Brand Identity */}
        <div className="mb-10 flex items-center gap-6">
           <div className="p-4 bg-emerald-600/10 rounded-[2rem] border border-emerald-500/20 shadow-2xl">
              <Shield className="text-emerald-500" size={40} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                 Initialize <span className="text-emerald-500">Admin</span>
              </h1>
              <p className="text-gray-500 text-xs mt-2 font-bold uppercase tracking-widest leading-none">Root Node Enrollment Portal</p>
           </div>
        </div>

        {/* Signup Card */}
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
           <div className="p-10 space-y-8">
              <div className="space-y-2">
                 <h2 className="text-white text-lg font-bold">Create Master Account</h2>
                 <p className="text-gray-500 text-xs font-medium">Define your administrative credentials to begin managing the Skilled Ustaad ecosystem.</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-6">
                 {/* Input Group: Email */}
                 <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Registry Email</label>
                    <div className="relative">
                       <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                       <input 
                         type="email" 
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         placeholder="admin@skilledustaad.com"
                         className="w-full bg-black/40 border border-white/10 rounded-[1.5rem] py-4 pl-14 pr-6 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                       />
                    </div>
                 </div>

                 {/* Input Group: Password */}
                 <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Access Passphrase</label>
                    <div className="relative">
                       <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                       <input 
                         type="password" 
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         placeholder="••••••••"
                         className="w-full bg-black/40 border border-white/10 rounded-[1.5rem] py-4 pl-14 pr-6 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                       />
                    </div>
                 </div>

                 {/* Notifications */}
                 {feedback && (
                   <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in fade-in duration-300 ${
                     feedback.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                   }`}>
                      {feedback.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{feedback.message}</span>
                   </div>
                 )}

                 {/* Submit Action */}
                 <button 
                   type="submit" 
                   disabled={loading}
                   className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                 >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        Provision Account
                        <ChevronRight size={18} />
                      </>
                    )}
                 </button>
              </form>
           </div>

           {/* Policy Footer */}
           <div className="px-10 py-6 bg-black/40 border-t border-white/5 space-y-4">
              <div className="flex items-center gap-4 text-gray-600">
                 <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-emerald-500/20 animate-pulse"></div>
                 </div>
              </div>
              <p className="text-[10px] text-gray-600 text-center font-bold uppercase tracking-widest leading-relaxed">
                Notice: By provisioning this account, you acknowledge the terms of the administrative security policy. 
                Unauthorized data exfiltration is strictly prohibited.
              </p>
           </div>
        </div>

        {/* Redirect Link */}
        <p className="text-center mt-8 text-xs font-bold text-gray-600 uppercase tracking-widest">
           Existing Operator?{" "}
           <button 
             onClick={() => navigate("/login")}
             className="text-emerald-500 hover:text-emerald-400 transition-colors ml-1 font-black"
           >
              Login to Console
           </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;

