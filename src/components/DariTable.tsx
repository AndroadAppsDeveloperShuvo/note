import React, { useState } from 'react';
import { DariEntry } from '../types/poultry';
import { Trash2, Edit2, Copy, Mic, Filter, Search, Scale, FileSpreadsheet } from 'lucide-react';

interface DariTableProps {
  entries: DariEntry[];
  activeFilterBuyer: string;
  onSelectFilterBuyer: (buyer: string) => void;
  buyerList: string[];
  onDeleteEntry: (id: string) => void;
  onEditEntry: (entry: DariEntry) => void;
  onDuplicateEntry: (entry: DariEntry) => void;
}

export const DariTable: React.FC<DariTableProps> = ({
  entries,
  activeFilterBuyer,
  onSelectFilterBuyer,
  buyerList,
  onDeleteEntry,
  onEditEntry,
  onDuplicateEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    const matchesBuyer = activeFilterBuyer === 'ALL' || e.buyerName === activeFilterBuyer;
    const matchesSearch =
      !searchTerm ||
      e.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.dariNo.toString().includes(searchTerm) ||
      e.totalGrossKg.toString().includes(searchTerm);
    return matchesBuyer && matchesSearch;
  });

  return (
    <div className="bg-slate-900 px-4 py-4 space-y-3">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Buyer Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => onSelectFilterBuyer('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeFilterBuyer === 'ALL'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              সব খদ্দের ({entries.length})
            </button>
            {buyerList.map((b) => {
              const count = entries.filter((e) => e.buyerName === b).length;
              return (
                <button
                  key={b}
                  onClick={() => onSelectFilterBuyer(b)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                    activeFilterBuyer === b
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {b} ({count})
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="দারি বা খদ্দের খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-full sm:w-44"
            />
          </div>
        </div>

        {/* Entries Cards / Mobile Table */}
        {filteredEntries.length === 0 ? (
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <Scale className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">কোনো داری রেকর্ড পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500">
              মাইক বোতামে চাপ দিয়ে বলুন (যেমন: "নাইম ৩৫ কেজি ২০০ গ্রাম") অথবা ম্যানুয়াল টাইপ করুন।
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEntries.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl p-3 shadow-md flex items-center justify-between gap-3 transition-colors"
              >
                {/* Left: Dari # & Buyer badge */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium">দারি</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono-num">#{item.dariNo}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{item.buyerName}</span>
                      {item.isVoiceEntry && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <Mic className="w-2.5 h-2.5" /> ভয়েস
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>
                        কাঁচা: <strong className="text-slate-200 font-mono-num">{item.totalGrossKg}</strong> কেজি
                      </span>
                      <span>·</span>
                      <span>
                        খাঁচা বাদ: <strong className="text-blue-400 font-mono-num">{item.tareKg}</strong> কেজি
                      </span>
                      {item.birdCount > 0 && (
                        <>
                          <span>·</span>
                          <span>{item.birdCount} পিস</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Net Kg, Subtotal & Actions */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-base font-bold text-emerald-400 font-mono-num">
                      {item.netKg.toFixed(3)} <span className="text-xs font-normal text-slate-400">নিট কেজি</span>
                    </div>
                    <div className="text-xs font-semibold text-amber-300 font-mono-num">
                      ৳{item.totalPrice.toLocaleString('bn-BD')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateEntry(item)}
                      className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="কপি করুন"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEditEntry(item)}
                      className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="সম্পাদন করুন"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(item.id)}
                      className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
