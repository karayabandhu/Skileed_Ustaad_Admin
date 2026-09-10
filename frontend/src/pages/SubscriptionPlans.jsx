import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, CheckCircle, IndianRupee, Save } from "lucide-react";
import api from "../api";
import { toast } from "sonner";

const SubscriptionPlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        durationDays: 30,
        price: 0,
        originalPrice: 0,
        savings: "",
        badge: "",
        popular: false,
        features: [""],
        isActive: true
    });

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await api.get("/v1/subscription-plans");
            if (res.data?.success) {
                setPlans(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching plans:", err);
            toast.error("Failed to load subscription plans.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setCurrentPlan(plan);
            setFormData({
                name: plan.name,
                durationDays: plan.durationDays,
                price: plan.price,
                originalPrice: plan.originalPrice,
                savings: plan.savings,
                badge: plan.badge,
                popular: plan.popular,
                features: plan.features.length ? plan.features : [""],
                isActive: plan.isActive
            });
        } else {
            setCurrentPlan(null);
            setFormData({
                name: "",
                durationDays: 30,
                price: 0,
                originalPrice: 0,
                savings: "",
                badge: "",
                popular: false,
                features: [""],
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentPlan(null);
    };

    const handleFeatureChange = (index, value) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = value;
        setFormData({ ...formData, features: newFeatures });
    };

    const addFeature = () => {
        setFormData({ ...formData, features: [...formData.features, ""] });
    };

    const removeFeature = (index) => {
        const newFeatures = formData.features.filter((_, i) => i !== index);
        setFormData({ ...formData, features: newFeatures });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = { ...formData, features: formData.features.filter(f => f.trim() !== "") };
            
            if (currentPlan) {
                const res = await api.put(`/v1/subscription-plans/${currentPlan._id}`, dataToSubmit);
                if (res.data?.success) {
                    toast.success("Plan updated successfully!");
                }
            } else {
                const res = await api.post("/v1/subscription-plans", dataToSubmit);
                if (res.data?.success) {
                    toast.success("Plan created successfully!");
                }
            }
            fetchPlans();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving plan:", error);
            toast.error(error.response?.data?.message || "Failed to save plan.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this plan?")) return;
        try {
            const res = await api.delete(`/v1/subscription-plans/${id}`);
            if (res.data?.success) {
                toast.success("Plan deleted successfully!");
                fetchPlans();
            }
        } catch (error) {
            console.error("Error deleting plan:", error);
            toast.error("Failed to delete plan.");
        }
    };

    if (loading && !plans.length) {
        return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Subscription Plans</h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Manage provider partner subscription passes</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2"
                >
                    <Plus size={16} /> New Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan._id} className={`relative bg-white dark:bg-gray-950 p-6 rounded-3xl border ${plan.isActive ? 'border-gray-100 dark:border-gray-800' : 'border-rose-100 dark:border-rose-900/50 opacity-70'} shadow-sm hover:shadow-xl transition-all duration-300`}>
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow-md">
                                Most Popular
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">{plan.name}</h3>
                                <p className="text-xs font-bold text-gray-400 mt-1">{plan.durationDays} Days Duration</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenModal(plan)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16}/></button>
                                <button onClick={() => handleDelete(plan._id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>

                        <div className="my-4 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-gray-900 dark:text-white flex items-center"><IndianRupee size={20} className="-mr-0.5" />{plan.price}</span>
                            {plan.originalPrice > plan.price && (
                                <span className="text-xs text-gray-400 line-through">₹{plan.originalPrice}</span>
                            )}
                            {plan.savings && (
                                <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">{plan.savings}</span>
                            )}
                        </div>

                        <div className="space-y-2 mt-4 text-xs text-gray-600 dark:text-gray-400 font-medium">
                            {plan.features.slice(0, 4).map((feat, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="line-clamp-1">{feat}</span>
                                </div>
                            ))}
                            {plan.features.length > 4 && (
                                <div className="text-[10px] text-gray-400 uppercase font-bold italic mt-2">
                                    + {plan.features.length - 4} more features
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-950 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                            <h2 className="text-lg font-black uppercase text-gray-900 dark:text-white">{currentPlan ? "Edit Plan" : "Create New Plan"}</h2>
                            <button onClick={handleCloseModal} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full hover:bg-rose-500 hover:text-white transition-all text-gray-500">
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="planForm" onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Plan Name</label>
                                        <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-medium" placeholder="e.g. Monthly Pass" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Duration (Days)</label>
                                        <input required type="number" min="1" value={formData.durationDays} onChange={(e) => setFormData({...formData, durationDays: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-medium" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Price (₹)</label>
                                        <input required type="number" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-medium" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Original Price (₹)</label>
                                        <input required type="number" min="0" value={formData.originalPrice} onChange={(e) => setFormData({...formData, originalPrice: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-medium" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Savings Text</label>
                                        <input type="text" value={formData.savings} onChange={(e) => setFormData({...formData, savings: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-medium" placeholder="e.g. Save 50%" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Badge Label</label>
                                        <input type="text" value={formData.badge} onChange={(e) => setFormData({...formData, badge: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-medium" placeholder="e.g. 1 Month Access" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 py-2 border-y border-gray-100 dark:border-gray-800">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.popular} onChange={(e) => setFormData({...formData, popular: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Mark as Popular</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Plan is Active</span>
                                    </label>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">Plan Features</label>
                                        <button type="button" onClick={addFeature} className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors">Add Feature</button>
                                    </div>
                                    {formData.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input type="text" value={feat} onChange={(e) => handleFeatureChange(idx, e.target.value)} placeholder={`Feature ${idx + 1}`} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" required />
                                            {formData.features.length > 1 && (
                                                <button type="button" onClick={() => removeFeature(idx)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={16}/></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </form>
                        </div>
                        
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                            <button onClick={handleCloseModal} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-all">Cancel</button>
                            <button type="submit" form="planForm" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2">
                                <Save size={16}/> Save Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionPlans;
