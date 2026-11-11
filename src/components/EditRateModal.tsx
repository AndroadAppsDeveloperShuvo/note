import React, { useState } from 'react';
import { X, Tag, Check } from 'lucide-react';

interface EditRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRate: number;
  onSaveRate: (ratePerKg: number) => void;
}

export const EditRateModal: React.FC<EditRateModalProps> = ({
  isOpen,
  onClose,
  currentRate,
  onSaveRate,
}) => {
  if (!isOpen) return null;

  const [ratePerKg, setRatePerKg] = useState<number>(currentRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRate(ratePerKg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" /> প্রতি কেজি দর (Rate per Kg)
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
              মুরগির কেজি প্রতি বিক্রি দর নির্ধারণ করুন (৳):
            </label>
            <input
              type="number"
              min="0"
              max="2000"
              required
              value={ratePerKg}
              onChange={(e) => setRatePerKg(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-center text-xl text-amber-300 font-bold font-mono-num focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick rate presets */}
          <div className="flex gap-2 justify-center text-xs flex-wrap">
            {[150, 160, 165, 170, 175, 180, 200, 240, 280, 320].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setRatePerKg(val)}
                className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-colors ${
                  ratePerKg === val
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                ৳{val}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" /> দর সংরক্ষণ করুন
          </button>
        </form>
      </div>
    </div>
  );
};
