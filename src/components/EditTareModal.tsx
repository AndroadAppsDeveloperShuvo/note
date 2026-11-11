import React, { useState } from 'react';
import { X, Scale, Check } from 'lucide-react';

interface EditTareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTareKg: number;
  onSaveTare: (tareKg: number) => void;
}

export const EditTareModal: React.FC<EditTareModalProps> = ({
  isOpen,
  onClose,
  currentTareKg,
  onSaveTare,
}) => {
  if (!isOpen) return null;

  const [tareKg, setTareKg] = useState<number>(currentTareKg);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTare(tareKg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-400" /> খাঁচার ওজন বাদ (Crate Tare Kg)
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              খালি খাঁচা/ঝুড়ির ওজন নির্ধারণ করুন (কেজি):
            </label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="20"
              required
              value={tareKg}
              onChange={(e) => setTareKg(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-center text-xl text-blue-400 font-bold font-mono-num focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-2 justify-center text-xs">
            {[0, 1.5, 2.0, 2.1, 2.5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setTareKg(val)}
                className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-colors ${
                  tareKg === val
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                {val === 0 ? '০ (বাদ নাই)' : `${val} কেজি`}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" /> খাঁচার ওজন সংরক্ষণ করুন
          </button>
        </form>
      </div>
    </div>
  );
};
