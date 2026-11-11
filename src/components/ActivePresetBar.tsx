import React from 'react';
import { User, Scale, Tag, Plus, ChevronRight, Check } from 'lucide-react';

interface ActivePresetBarProps {
  activeBuyer: string;
  onChangeBuyer: (buyer: string) => void;
  buyerList: string[];
  onAddNewBuyer: () => void;
  tareKg: number;
  onEditTare: () => void;
  ratePerKg: number;
  onEditRate: () => void;
  totalGrossKg: number;
  totalNetKg: number;
  totalAmount: number;
  totalDariCount: number;
}

export const ActivePresetBar: React.FC<ActivePresetBarProps> = ({
  activeBuyer,
  onChangeBuyer,
  buyerList,
  onAddNewBuyer,
  tareKg,
  onEditTare,
  ratePerKg,
  onEditRate,
  totalNetKg,
  totalAmount,
  totalDariCount,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 p-3">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Active Presets Bar */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Active Buyer Selector */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-emerald-400" /> চলতি খদ্দের
            </span>
            <div className="mt-1 flex items-center justify-between">
              <select
                value={activeBuyer}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    onAddNewBuyer();
                  } else {
                    onChangeBuyer(e.target.value);
                  }
                }}
                className="bg-transparent text-emerald-300 font-bold text-sm focus:outline-none cursor-pointer w-full"
              >
                {buyerList.map((b) => (
                  <option key={b} value={b} className="bg-slate-800 text-white">
                    {b}
                  </option>
                ))}
                <option value="__add_new__" className="bg-slate-800 text-amber-400 font-semibold">
                  + নতুন খদ্দের যোগ করুন
                </option>
              </select>
            </div>
          </div>

          {/* Tare Weight Preset */}
          <button
            onClick={onEditTare}
            className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl p-2.5 text-left flex flex-col justify-between transition-colors group"
          >
            <span className="text-slate-400 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-blue-400" /> খাঁচার ওজন বাদ
              </span>
              <span className="text-[10px] text-blue-400 group-hover:underline">বদলান</span>
            </span>
            <div className="mt-1 text-sm font-bold text-white font-mono-num">
              {tareKg.toFixed(2)} <span className="text-xs font-normal text-slate-400">কেজি</span>
            </div>
          </button>

          {/* Rate Per Kg Preset */}
          <button
            onClick={onEditRate}
            className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl p-2.5 text-left flex flex-col justify-between transition-colors group"
          >
            <span className="text-slate-400 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> প্রতি কেজি দর
              </span>
              <span className="text-[10px] text-amber-400 group-hover:underline">বদলান</span>
            </span>
            <div className="mt-1 text-sm font-bold text-amber-300 font-mono-num">
              ৳{ratePerKg} <span className="text-xs font-normal text-slate-400">/কেজি</span>
            </div>
          </button>
        </div>

        {/* Quick Running Totals Bar */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-800/80 to-slate-900 border border-emerald-500/20 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono-num">
              {totalDariCount} টি داری
            </span>
            <span className="text-slate-300">
              মোট নিট ওজন: <strong className="text-emerald-400 text-sm font-mono-num">{totalNetKg.toFixed(3)}</strong> কেজি
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-400">মোট টাকা: </span>
            <strong className="text-amber-300 text-sm font-mono-num">৳{totalAmount.toLocaleString('bn-BD')}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
