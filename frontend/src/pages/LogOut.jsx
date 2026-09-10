import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldOff, CheckCircle } from "lucide-react";

/**
 * Premium Session Termination Portal
 * Handles the secure logout of administrative personnel
 */
const Logout = ({ onLogout }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("terminating");

  useEffect(() => {
    const handleLogout = async () => {
      // 1. Initial visual pause for effect
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 2. Clear credentials from storage
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      
      // 3. Update global auth state
      if (onLogout) onLogout();
      
      // 4. Update status for final handoff
      setStatus("complete");
      
      // 5. Final redirect to login node
      setTimeout(() => {
        navigate("/login");
      }, 800);
    };

    handleLogout();
  }, [navigate, onLogout]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans italic selection:bg-rose-500/20 selection:text-white uppercase font-black">
      {/* Dynamic Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-rose-600/5 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-sm p-6 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden p-10 text-center">
          
          <div className="relative inline-flex items-center justify-center mb-8">
             <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl"></div>
             {status === "terminating" ? (
               <div className="relative z-10 p-6 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl">
                 <ShieldOff className="text-blue-500 animate-pulse" size={48} />
               </div>
             ) : (
               <div className="relative z-10 p-6 bg-emerald-500/10 rounded-[2.5rem] border border-emerald-500/10 shadow-2xl scale-110 transition-transform duration-500">
                 <CheckCircle className="text-emerald-500" size={48} />
               </div>
             )}
          </div>

          <div className="space-y-4">
            <h2 className="text-white text-2xl font-black tracking-tighter uppercase font-serif">
              {status === "terminating" ? "Closing Session" : "Session Dead"}
            </h2>
            
            <div className="flex flex-col items-center gap-3">
               <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black tracking-[0.3em]">
                  {status === "terminating" && <Loader2 className="animate-spin" size={12} />}
                  {status === "terminating" ? "Wiping Temporary Cache" : "Secure Node Disconnected"}
               </div>
               
               {/* Progress bar line */}
               <div className="h-0.5 w-32 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full bg-blue-500 transition-all duration-[1600ms] ${status === "complete" ? "w-full bg-emerald-500" : "w-1/2"}`}></div>
               </div>
            </div>

            <p className="text-gray-600 text-[10px] font-bold tracking-widest leading-relaxed mt-4 px-4 uppercase italic">
              Redirecting to authentication terminal...
            </p>
          </div>
        </div>

        {/* Console Footprint */}
        <div className="mt-8 text-center opacity-30">
           <span className="text-gray-600 text-[9px] font-black uppercase tracking-[0.4em] font-serif">
              Node ID: KM-AD-01 • Access Nullified
           </span>
        </div>
      </div>
    </div>
  );
};

export default Logout;

