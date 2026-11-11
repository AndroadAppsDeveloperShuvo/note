import React from 'react';
import { Mic, Volume2, VolumeX, Settings, Sparkles, Scale, DollarSign, UserCheck, Smartphone } from 'lucide-react';
import { AppSettings } from '../utils/storage';

interface HeaderProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenSettingsModal: () => void;
  onOpenAiModal: () => void;
  onToggleIPhoneFrame: () => void;
  isIPhoneFrame: boolean;
  totalSessionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettingsModal,
  onOpenAiModal,
  onToggleIPhoneFrame,
  isIPhoneFrame,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Title */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight flex items-center gap-1.5">
              পোল্ট্রি ভয়েস স্কেল
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                v2.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              মুখ দিয়ে বলুন, স্বয়ংক্রিয়ভাবে কেজি ও মোট টাকা সংরক্ষণ হবে
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* AI Advisor Button */}
          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors"
            title="এআই খামার পরামর্শক"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="hidden xs:inline">এআই বাজার দর</span>
          </button>

          {/* iPhone Viewport Toggle */}
          <button
            onClick={onToggleIPhoneFrame}
            className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
              isIPhoneFrame
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="iPhone 12 Pro মোড অন/অফ"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">iPhone 12 Pro</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => onUpdateSettings({ enableAudioChime: !settings.enableAudioChime })}
            className={`p-2 rounded-lg border transition-colors ${
              settings.enableAudioChime
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={settings.enableAudioChime ? 'শব্দ সংকেত চালু' : 'শব্দ সংকেত বন্ধ'}
          >
            {settings.enableAudioChime ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Preset Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
            title="সেটিংস ও ডিফল্ট মান"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
