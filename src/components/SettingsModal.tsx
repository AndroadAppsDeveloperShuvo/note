import React, { useState } from 'react';
import { X, Save, RefreshCw, Volume2, Sparkles, Download, Upload } from 'lucide-react';
import { AppSettings } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onExportData,
  onImportData,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [importStr, setImportStr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            ⚙️ অ্যাপ সেটিংস ও ডিফল্ট মান
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Default Tare Weight */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              ডিফল্ট খাঁচার ওজন বাদ (Crate Tare Kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={form.defaultTareKg}
              onChange={(e) => setForm({ ...form, defaultTareKg: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono-num focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              প্রতিটি Dari মাপার সময় স্বয়ংক্রিয়ভাবে এই খাঁচার খালি ওজন বাদ যাবে।
            </p>
          </div>

          {/* Default Rate per Kg */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              ডিফল্ট কেজি প্রতি বিক্রি দর (৳)
            </label>
            <input
              type="number"
              min="0"
              value={form.defaultRatePerKg}
              onChange={(e) => setForm({ ...form, defaultRatePerKg: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold font-mono-num focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Audio & Voice Toggles */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="font-semibold text-slate-300 block mb-1">শব্দ ও ভয়েস অপশন</span>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">ভয়েস এন্ট্রিতে বিওপ শব্দ সংকেত (Sound Chime)</span>
              <input
                type="checkbox"
                checked={form.enableAudioChime}
                onChange={(e) => setForm({ ...form, enableAudioChime: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">বাংলা ভয়েস পড়ে শোনানো (Voice Reply)</span>
              <input
                type="checkbox"
                checked={form.enableTtsSpeak}
                onChange={(e) => setForm({ ...form, enableTtsSpeak: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">অটো হ্যান্ডস-ফ্রি মোড চালু রাখা</span>
              <input
                type="checkbox"
                checked={form.enableAutoHandsFree}
                onChange={(e) => setForm({ ...form, enableAutoHandsFree: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Export / Backup Section */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 block">ব্যাকআপ ও ডাটা এক্সপোর্ট</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onExportData}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4 text-emerald-400" /> ডাউনলোড ব্যাকআপ (JSON)
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> সেটিং সংরক্ষণ করুন
          </button>
        </form>
      </div>
    </div>
  );
};
