import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Shield, Loader2, X, CheckCircle, AlertCircle } from "lucide-react";
import api from "../api";

const AVAILABLE_PERMISSIONS = [
  { id: "manage_users", label: "Manage Users" },
  { id: "manage_providers", label: "Manage Providers" },
  { id: "manage_bookings", label: "Manage Bookings" },
  { id: "manage_finance", label: "Manage Finance" },
  { id: "manage_support", label: "Manage Support" },
  { id: "manage_settings", label: "Manage Settings" },
];

const SubAdmins = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null); // null means adding new

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    permissions: [],
  });
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Retrieve logged-in admin data
  const loggedInAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
  const isSuperAdmin = loggedInAdmin.role === "superadmin";

  const fetchSubAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/subadmins");
      setSubAdmins(res.data.subAdmins);
    } catch (error) {
      console.error("Error fetching sub-admins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSubAdmins();
    }
  }, [isSuperAdmin]);

  const showFeedback = (message, type = "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenModal = (admin = null) => {
    if (admin) {
      setCurrentAdmin(admin);
      setFormData({
        name: admin.name || "",
        email: admin.email || "",
        password: "", // leave blank unless updating
        permissions: admin.permissions || [],
      });
    } else {
      setCurrentAdmin(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        permissions: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentAdmin(null);
  };

  const handlePermissionToggle = (permId) => {
    setFormData((prev) => {
      const currentPerms = prev.permissions;
      if (currentPerms.includes(permId)) {
        return { ...prev, permissions: currentPerms.filter((p) => p !== permId) };
      } else {
        return { ...prev, permissions: [...currentPerms, permId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      if (currentAdmin) {
        // Update
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // don't send empty password

        await api.put(`/admin/subadmins/${currentAdmin._id}`, payload);
        showFeedback("Sub-Admin updated successfully", "success");
      } else {
        // Create
        if (!formData.email || !formData.password) {
          showFeedback("Email and password are required");
          setSubmitLoading(false);
          return;
        }
        await api.post("/admin/subadmins", formData);
        showFeedback("Sub-Admin created successfully", "success");
      }
      
      fetchSubAdmins();
      handleCloseModal();
    } catch (error) {
      console.error("Submit error:", error);
      showFeedback(error.response?.data?.error || "An error occurred");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sub-admin?")) return;
    
    try {
      await api.delete(`/admin/subadmins/${id}`);
      setSubAdmins(subAdmins.filter(a => a._id !== id));
      showFeedback("Sub-Admin deleted", "success");
    } catch (error) {
      console.error("Delete error:", error);
      showFeedback(error.response?.data?.error || "Failed to delete");
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-500/10 border border-red-200 dark:border-red-800">
           <Shield size={48} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md text-sm font-medium">
          You do not have the required "Super Admin" privileges to view or manage the team.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Team Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage sub-admins and their departmental access permissions.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus size={18} />
          Add Sub-Admin
        </button>
      </div>

      {feedback && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${feedback.type === "success" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800"}`}>
          {feedback.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <p className="text-sm font-bold">{feedback.message}</p>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : subAdmins.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full mb-4">
            <Shield size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Sub-Admins Found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Create your first sub-admin to delegate responsibilities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subAdmins.map((admin) => (
            <div key={admin._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{admin.name || "Unnamed"}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{admin.email}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(admin)} className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(admin._id)} className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {admin.permissions?.length > 0 ? (
                      admin.permissions.map((perm) => (
                        <span key={perm} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-semibold">
                          {AVAILABLE_PERMISSIONS.find(p => p.id === perm)?.label || perm}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400 italic">No permissions assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">{currentAdmin ? "Edit Sub-Admin" : "Add Sub-Admin"}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter full name"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="admin@example.com"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Password {currentAdmin && <span className="text-gray-400 lowercase normal-case text-[10px] ml-1">(Leave blank to keep unchanged)</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!currentAdmin}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Department Permissions</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label 
                      key={perm.id} 
                      className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${formData.permissions.includes(perm.id) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => handlePermissionToggle(perm.id)}
                      />
                      <span className="ml-3 text-sm font-semibold text-gray-700 dark:text-gray-200">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitLoading && <Loader2 size={16} className="animate-spin" />}
                  {currentAdmin ? "Save Changes" : "Create Sub-Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAdmins;
