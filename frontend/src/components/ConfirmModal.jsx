import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 md:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-full mb-4 ${type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">{title || "Are you sure?"}</h3>
          <p className="text-sm font-medium text-gray-500 mb-8">{message}</p>
          
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-lg transition-all ${
                type === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
