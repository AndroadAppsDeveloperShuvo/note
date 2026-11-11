import React, { useState } from 'react';
import { X, Plus, Calendar, Trash2, Check, Download, FileSpreadsheet } from 'lucide-react';
import { SalesSession } from '../types/poultry';

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SalesSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: (title: string) => void;
  onDeleteSession: (id: string) => void;
  onExportCsv: () => void;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onExportCsv,
}) => {
  if (!isOpen) return null;

  const [newTitle, setNewTitle] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateSession(newTitle.trim());
    setNewTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" /> বিক্রি সেশন ও পূর্বের আর্কাইভ
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create New Session */}
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            placeholder="নতুন বিক্রি সেশনের নাম (যেমন: শেড-২ বিক্রি)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> নতুন লট
          </button>
        </form>

        {/* CSV Export Button */}
        <button
          onClick={onExportCsv}
          className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" /> এক্সেল/CSV রিপোর্ট ডাউনলোড করুন
        </button>

        {/* Session List */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-slate-400 block">সংরক্ষিত বিক্রি তালিকা:</span>
          {sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            const totalNetKg = sess.entries.reduce((sum, e) => sum + e.netKg, 0);
            const totalAmount = sess.entries.reduce((sum, e) => sum + e.totalPrice, 0);

            return (
              <div
                key={sess.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  isActive
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-white'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div
                  onClick={() => {
                    onSelectSession(sess.id);
                    onClose();
                  }}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{sess.title}</span>
                    {isActive && (
                      <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.2 rounded-full">
                        চালু
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span>{sess.entries.length} টি Dari</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-mono-num font-semibold">{totalNetKg.toFixed(2)} kg</span>
                    <span>·</span>
                    <span className="text-amber-300 font-mono-num">৳{totalAmount.toLocaleString('bn-BD')}</span>
                  </div>
                </div>

                {sessions.length > 1 && (
                  <button
                    onClick={() => onDeleteSession(sess.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
