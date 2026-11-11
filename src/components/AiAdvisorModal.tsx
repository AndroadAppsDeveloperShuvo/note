import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, Send, TrendingUp, HelpCircle } from 'lucide-react';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchSummary: {
    totalDari: number;
    totalGrossKg: number;
    totalNetKg: number;
    totalBirds: number;
    avgBirdWeight: number;
    totalAmount: number;
  };
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  batchSummary,
}) => {
  if (!isOpen) return null;

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const fetchAdvice = async (customQuestion?: string) => {
    setLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchSummary,
          question: customQuestion || prompt || 'এই বিক্রির দরদাম ও খামারির জন্য পরামর্শ দিন।',
        }),
      });

      const data = await res.json();
      setAiResponse(data.insight || 'পরামর্শ তৈরি করা হয়েছে।');
    } catch (e: any) {
      setAiResponse('এআই পরামর্শ পেতে সাময়িক সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">এআই খামার ও বাজার পরামর্শক</h3>
              <p className="text-xs text-slate-400">Gemini AI পরিচালিত খামার পর্যবেক্ষণ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Batch Context Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
          <span className="text-slate-400 font-semibold block">চলতি বিক্রির ডাটা:</span>
          <div className="grid grid-cols-3 gap-2 text-slate-200">
            <div>নিট কেজি: <strong className="text-emerald-400">{batchSummary.totalNetKg.toFixed(2)}</strong></div>
            <div>মোট বিক্রি: <strong className="text-amber-300">৳{batchSummary.totalAmount}</strong></div>
            <div>গড় ওজন: <strong>{batchSummary.avgBirdWeight.toFixed(2)} kg</strong></div>
          </div>
        </div>

        {/* Quick Query Presets */}
        <div className="space-y-1.5 text-xs">
          <span className="text-slate-400 font-medium block">দ্রুত প্রশ্ন চাপুন:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => fetchAdvice('বর্তমান ব্রয়লার ও সোনালী মুরগির আনুমানিক বাজার দর কত?')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 transition-colors"
            >
              📊 বাজারের সাম্প্রতিক দরদাম?
            </button>
            <button
              onClick={() => fetchAdvice('এই ব্যাচের মুরগির নিট ওজন ও গড় ওজন বিশ্লেষণ করুন।')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-slate-700 transition-colors"
            >
              ⚖️ বিক্রির ওজন কি সন্তোষজনক?
            </button>
            <button
              onClick={() => fetchAdvice('খামারের ফিড কনভার্সন রেশিও (FCR) ও খাদ্য খরচ বাঁচানোর টিপস দিন।')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-blue-300 border border-slate-700 transition-colors"
            >
              🐔 খাদ্য (Feed) খরচ কমানোর টিপস?
            </button>
          </div>
        </div>

        {/* Custom Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="আপনার প্রশ্ন লিখুন (যেমন: ১০০ কেজি মুরগিতে লাভ কত হবে?)..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAdvice()}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => fetchAdvice()}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* AI Answer Display */}
        {loading && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-amber-200">Gemini এআই খামার বিশ্লেষণ করছে...</p>
          </div>
        )}

        {aiResponse && !loading && (
          <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-amber-500/30 rounded-xl p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" /> এআই পর্যবেক্ষণ:
            </div>
            <div className="prose prose-invert text-xs">{aiResponse}</div>
          </div>
        )}
      </div>
    </div>
  );
};
