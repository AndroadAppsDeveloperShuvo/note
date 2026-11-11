import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';

interface AddBuyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBuyer: (name: string) => void;
}

export const AddBuyerModal: React.FC<AddBuyerModalProps> = ({
  isOpen,
  onClose,
  onAddBuyer,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddBuyer(name.trim());
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" /> নতুন খদ্দের যুক্ত করুন
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              খদ্দেরের নাম লিখুন:
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="যেমন: নাইম, রফিক, আলম, বাবুল..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-2 text-xs pt-1">
            {['নাইম', 'রফিক', 'সুমন', 'শাহীন', 'আলম'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setName(preset)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700"
              >
                + {preset}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" /> খদ্দের নিশ্চিত করুন
          </button>
        </form>
      </div>
    </div>
  );
};
