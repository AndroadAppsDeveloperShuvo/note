import React, { useState } from 'react';
import { X, Check, UserPlus, Scale, Plus, Minus } from 'lucide-react';
import { DariEntry } from '../types/poultry';

interface QuickManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBuyer: string;
  buyerList: string[];
  defaultTareKg: number;
  defaultRatePerKg: number;
  onSaveEntry: (entry: Partial<DariEntry>) => void;
  onAddNewBuyer: () => void;
  editingEntry?: DariEntry | null;
}

export const QuickManualModal: React.FC<QuickManualModalProps> = ({
  isOpen,
  onClose,
  activeBuyer,
  buyerList,
  defaultTareKg,
  defaultRatePerKg,
  onSaveEntry,
  onAddNewBuyer,
  editingEntry,
}) => {
  if (!isOpen) return null;

  const [buyerName, setBuyerName] = useState(editingEntry ? editingEntry.buyerName : activeBuyer);
  const [grossKg, setGrossKg] = useState<number>(editingEntry ? editingEntry.grossKg : 35);
  const [grossGrams, setGrossGrams] = useState<number>(editingEntry ? editingEntry.grossGrams : 0);
  const [tareKg, setTareKg] = useState<number>(editingEntry ? editingEntry.tareKg : defaultTareKg);
  const [birdCount, setBirdCount] = useState<number>(editingEntry ? editingEntry.birdCount : 15);
  const [ratePerKg, setRatePerKg] = useState<number>(editingEntry ? editingEntry.ratePerKg : defaultRatePerKg);
  const [dariNo, setDariNo] = useState<number | undefined>(editingEntry ? editingEntry.dariNo : undefined);

  const totalGrossKg = Number((grossKg + grossGrams / 1000).toFixed(3));
  const netKg = Number(Math.max(0, totalGrossKg - tareKg).toFixed(3));
  const totalPrice = Math.round(netKg * ratePerKg);

  const handleQuickAddKg = (val: number) => {
    setGrossKg((prev) => Math.max(0, prev + val));
  };

  const handleQuickAddGram = (val: number) => {
    let newGram = grossGrams + val;
    if (newGram >= 1000) {
      setGrossKg((prev) => prev + Math.floor(newGram / 1000));
      newGram = newGram % 1000;
    } else if (newGram < 0) {
      if (grossKg > 0) {
        setGrossKg((prev) => prev - 1);
        newGram = 1000 + newGram;
      } else {
        newGram = 0;
      }
    }
    setGrossGrams(newGram);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalGrossKg <= 0) return;

    onSaveEntry({
      id: editingEntry ? editingEntry.id : undefined,
      buyerName,
      grossKg,
      grossGrams,
      totalGrossKg,
      tareKg,
      netKg,
      birdCount,
      ratePerKg,
      totalPrice,
      dariNo,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              {editingEntry ? 'dari সম্পাদন করুন' : 'নতুন داری মেজারমেন্ট (ম্যানুয়াল এন্ট্রি)'}
            </h3>
            <p className="text-xs text-slate-400">কেজি, গ্রাম ও দর নির্ধারণ করুন</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Buyer Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">খদ্দেরের নাম</label>
            <div className="flex gap-2">
              <select
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
              >
                {buyerList.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onAddNewBuyer}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-amber-400 text-xs font-semibold flex items-center gap-1"
              >
                <UserPlus className="w-4 h-4" /> নতুন
              </button>
            </div>
          </div>

          {/* KG and Gram inputs with large touch controls */}
          <div className="grid grid-cols-2 gap-3">
            {/* KG Input */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
              <label className="block text-xs font-semibold text-slate-400">কাঁচা কেজি (Gross Kg)</label>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleQuickAddKg(-1)}
                  className="w-10 h-10 rounded-lg bg-slate-800 active:bg-slate-700 text-white font-bold text-lg flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={grossKg}
                  onChange={(e) => setGrossKg(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-20 bg-transparent text-center font-mono-num text-2xl font-bold text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleQuickAddKg(1)}
                  className="w-10 h-10 rounded-lg bg-slate-800 active:bg-slate-700 text-white font-bold text-lg flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Kg Buttons */}
              <div className="flex gap-1 justify-center pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickAddKg(5)}
                  className="px-2 py-1 rounded bg-slate-800 text-[11px] font-semibold text-emerald-400"
                >
                  +৫ কেজি
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddKg(10)}
                  className="px-2 py-1 rounded bg-slate-800 text-[11px] font-semibold text-emerald-400"
                >
                  +১০ কেজি
                </button>
              </div>
            </div>

            {/* Gram Input */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
              <label className="block text-xs font-semibold text-slate-400">গ্রাম (Grams)</label>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleQuickAddGram(-50)}
                  className="w-10 h-10 rounded-lg bg-slate-800 active:bg-slate-700 text-white font-bold text-lg flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="999"
                  step="50"
                  value={grossGrams}
                  onChange={(e) => setGrossGrams(Math.min(999, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  className="w-20 bg-transparent text-center font-mono-num text-2xl font-bold text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleQuickAddGram(50)}
                  className="w-10 h-10 rounded-lg bg-slate-800 active:bg-slate-700 text-white font-bold text-lg flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Gram Buttons */}
              <div className="flex gap-1 justify-center pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickAddGram(100)}
                  className="px-2 py-1 rounded bg-slate-800 text-[11px] font-semibold text-blue-400"
                >
                  +১০০ গ্রাম
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddGram(500)}
                  className="px-2 py-1 rounded bg-slate-800 text-[11px] font-semibold text-blue-400"
                >
                  +৫০০ গ্রাম
                </button>
              </div>
            </div>
          </div>

          {/* Tare, Birds, and Rate Controls */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">খাঁচার ওজন বাদ</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={tareKg}
                onChange={(e) => setTareKg(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 font-mono-num text-sm text-center text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">মুরগির সংখ্যা (পিস)</label>
              <input
                type="number"
                min="0"
                value={birdCount}
                onChange={(e) => setBirdCount(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 font-mono-num text-sm text-center text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">দর (৳/কেজি)</label>
              <input
                type="number"
                min="0"
                value={ratePerKg}
                onChange={(e) => setRatePerKg(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 font-mono-num text-sm text-center text-amber-300 font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Live Net Calculation Summary Box */}
          <div className="bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block">মোট নিট মুরগির ওজন</span>
              <strong className="text-emerald-400 text-lg font-mono-num">{netKg} কেজি</strong>
              <span className="text-[10px] text-slate-400 block">({totalGrossKg} কেজি - {tareKg} কেজি খাঁচা)</span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block">মোট টাকা</span>
              <strong className="text-amber-300 text-lg font-mono-num">৳{totalPrice.toLocaleString('bn-BD')}</strong>
              {birdCount > 0 && (
                <span className="text-[10px] text-slate-400 block">
                  (গড় weight: {(netKg / birdCount).toFixed(2)} কেজি/পিস)
                </span>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-5 h-5" />
            {editingEntry ? 'পরিবর্তন সংরক্ষণ করুন' : 'দারি সংরক্ষণ করুন'}
          </button>
        </form>
      </div>
    </div>
  );
};
