import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogIn, UserPlus, Mail, Lock, Shield, ArrowRight, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import api from "../api";

/**
 * Handles both Login and Signup for Skilled Ustaad Administration
 */
const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = location.pathname === "/login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (message, type = "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showFeedback("Please provide all credentials");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password, role: "admin" });
      const data = res.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));
      showFeedback("Authentication successful", "success");
      
      // Brief delay for user to see success
      setTimeout(() => {
        setIsAuthenticated(true);
        navigate("/");
      }, 800);
    } catch (error) {
      console.error("Auth Error:", error);
      showFeedback(error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md p-4 relative z-10 animate-in fade-in zoom-in duration-500">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/10 rounded-3xl mb-4 border border-blue-500/20 shadow-xl shadow-blue-500/5">
            <Shield className="text-blue-500" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase font-serif">
            Skilled Ustaad <span className="text-blue-500">Admin</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium tracking-tight uppercase">Secure Management Portal</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
          {/* Login Header (Signup Disabled) */}
          <div className="flex p-2 bg-black/20 m-6 rounded-2xl border border-white/5">
            <div 
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-600/20"
            >
              <LogIn size={14} /> Admin Authentication
            </div>
          </div>

          <form onSubmit={handleAuth} className="p-8 pt-2 space-y-6">
            {/* Input Groups */}
            <div className="space-y-4">
              <div className="relative group">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="relative group">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Access Secret</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Error/Success Feed */}
            {feedback && (
              <div className={`flex items-center gap-3 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-300 ${feedback.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"}`}>
                {feedback.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <p className="text-xs font-bold uppercase tracking-tight">{feedback.message}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full group relative overflow-hidden py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Authenticate Access
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Advisory */}
          <div className="p-6 bg-black/20 border-t border-white/5 text-center">
             <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
               Advisory: This terminal is strictly for authorized administrative personnel. 
               All access attempts are monitored and logged.
             </p>
          </div>
        </div>
        
        {/* Subtle Bottom Link */}
        <div className="mt-8 text-center">
           <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest italic font-serif opacity-30">
              © 2026 SKILLED USTAAD ECOSYSTEM • SECURE NODE v4.2.0
           </span>
        </div>
      </div>
    </div>
  );
};

export default Login;

