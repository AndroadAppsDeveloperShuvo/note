import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, RefreshCw, CheckCircle2, RotateCcw, Send } from 'lucide-react';
import { parseBengaliVoiceClientSide } from '../utils/bengaliParser';
import { VoiceParseResult, DariEntry } from '../types/poultry';
import { audioManager } from '../utils/audioHelper';
import { AppSettings } from '../utils/storage';

interface VoiceMicBarProps {
  activeBuyer: string;
  defaultTareKg: number;
  defaultRatePerKg: number;
  onAddDariEntry: (entry: Partial<DariEntry>) => void;
  settings: AppSettings;
  lastAddedEntry: DariEntry | null;
  onUndoLastEntry: () => void;
  onOpenManualModal: () => void;
}

export const VoiceMicBar: React.FC<VoiceMicBarProps> = ({
  activeBuyer,
  defaultTareKg,
  defaultRatePerKg,
  onAddDariEntry,
  settings,
  lastAddedEntry,
  onUndoLastEntry,
  onOpenManualModal,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [parsePreview, setParsePreview] = useState<VoiceParseResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('মাইক চাপুন অথবা নিচে লিখে সেভ করুন');
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('আপনার ব্রাউজারে স্পিচ ফিচার নাই। নিচে সরাসরি টাইপ করে খুব সহজে সেভ করতে পারবেন।');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'bn-BD';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('🎙️ শুনছি... মুখে বলুন (যেমন: নাইম ৩৫ কেজি ২০০ গ্রাম)');
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript;
        }

        if (currentText) {
          setTranscriptInput(currentText);
          const preview = parseBengaliVoiceClientSide(currentText, activeBuyer, defaultRatePerKg);
          setParsePreview(preview);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('মাইক্রোফোন পারমিশন প্রয়োজন। ব্রাউজার সেটিংসে মাইক Allow করুন।');
        } else if (event.error === 'no-speech') {
          setStatusMessage('কোনো কথা শোনা যায়নি। আবার চেষ্টা করুন।');
        } else {
          setStatusMessage('ভয়েস সিগন্যাল পুনঃসংযোগ। নিচে টাইপ করে সেভ করতে পারেন।');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition setup failed:', e);
    }
  }, [activeBuyer, defaultRatePerKg]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      setStatusMessage('মাইক বন্ধ করা হয়েছে।');
    } else {
      setTranscriptInput('');
      setParsePreview(null);
      setSpeechError(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          setIsListening(false);
          setSpeechError('মাইক চালু করতে ব্রাউজার অনুমতি দিন বা নিচে লিখুন।');
        }
      } else {
        setSpeechError('আপনার ব্রাউজার মাইক সাপোর্ট করে না। নিচে লিখে এন্ট্রি করুন।');
      }
    }
  };

  const handleInputChange = (val: string) => {
    setTranscriptInput(val);
    if (val.trim().length >= 2) {
      const preview = parseBengaliVoiceClientSide(val, activeBuyer, defaultRatePerKg);
      setParsePreview(preview);
    } else {
      setParsePreview(null);
    }
  };

  // Instant Commit logic (< 2ms)
  const handleProcessAndCommit = (textToProcess?: string) => {
    const rawText = textToProcess || transcriptInput;
    if (!rawText || rawText.trim().length < 2) {
      setStatusMessage('❌ দয়া করে আগে মুখে বলুন অথবা ভয়েস বাক্য লিখুন');
      return;
    }

    // Run client parser instantly
    const parsedResult = parseBengaliVoiceClientSide(rawText, activeBuyer, defaultRatePerKg);

    if (parsedResult && parsedResult.weightKg > 0) {
      const totalGrossKg = parsedResult.weightKg;
      const tareKg = defaultTareKg;
      const netKg = Number(Math.max(0, totalGrossKg - tareKg).toFixed(3));
      const ratePerKg = parsedResult.ratePerKg || defaultRatePerKg;
      const totalPrice = Math.round(netKg * ratePerKg);

      const entryData: Partial<DariEntry> = {
        buyerName: parsedResult.buyerName || activeBuyer,
        grossKg: parsedResult.grossKg,
        grossGrams: parsedResult.grossGrams,
        totalGrossKg,
        tareKg,
        netKg,
        birdCount: parsedResult.birdCount || 0,
        ratePerKg,
        totalPrice,
        isVoiceEntry: true,
      };

      if (parsedResult.dariNo) {
        entryData.dariNo = parsedResult.dariNo;
      }

      // Add to state instantly!
      onAddDariEntry(entryData);

      // Sound feedback
      if (settings.enableAudioChime) {
        audioManager.playSuccessChime();
        audioManager.vibrate(100);
      }

      // Voice readout
      if (settings.enableTtsSpeak) {
        audioManager.speakBengali(
          `${entryData.buyerName} ${entryData.grossKg} কেজি ${entryData.grossGrams} গ্রাম সংরক্ষিত হয়েছে`
        );
      }

      setStatusMessage(
        `✅ ${entryData.buyerName}: ${entryData.totalGrossKg} কেজি (নিট ${entryData.netKg} কেজি) = ৳${totalPrice} সংরক্ষিত!`
      );
      setTranscriptInput('');
      setParsePreview(null);
    } else {
      if (settings.enableAudioChime) audioManager.playErrorChime();
      setStatusMessage('❌ ওজন বোঝা যায়নি। স্পষ্ট লিখুন (যেমন: "নাইম ৩৫ কেজি ২০০ গ্রাম")');
    }
  };

  return (
    <div className="bg-slate-900 px-4 py-4 border-b border-slate-800">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Voice Control Main Card */}
        <div className="relative bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                }`}
              />
              <span className="text-sm font-bold text-white">ভয়েস স্পিচ সহকারী</span>
            </div>

            <button
              onClick={onOpenManualModal}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              + ম্যানুয়াল ডায়াল টাইপ
            </button>
          </div>

          {/* Voice Input Box & Mic Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleListening}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                isListening
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse scale-105'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
              }`}
              title={isListening ? 'মাইক বন্ধ করুন' : 'মাইক চালু করুন'}
            >
              {isListening ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Input field for spoken transcript or direct typing */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={isListening ? 'কথা বলুন...' : 'মুখে বলুন অথবা লিখুন (যেমন: নাইম ৩৫ কেজি ২০০ গ্রাম)'}
                value={transcriptInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleProcessAndCommit()}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-sm text-emerald-300 font-bold font-mono-num focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => handleProcessAndCommit()}
              disabled={!transcriptInput.trim()}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-40 transition-all shrink-0"
            >
              <Send className="w-4 h-4" /> সেভ
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-snug">{statusMessage}</p>

          {/* Parsed Preview Badge */}
          {parsePreview && parsePreview.weightKg > 0 && (
            <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-2.5 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
              <div>
                খদ্দের: <strong>{parsePreview.buyerName}</strong> · কাঁচা ওজন:{' '}
                <strong className="font-mono-num font-bold text-sm text-emerald-400">
                  {parsePreview.weightKg} কেজি
                </strong>{' '}
                ({parsePreview.grossKg} kg {parsePreview.grossGrams} g)
              </div>
              <div className="font-mono-num font-bold text-amber-300">
                নিট: {(parsePreview.weightKg - defaultTareKg).toFixed(2)} kg = ৳
                {Math.round((parsePreview.weightKg - defaultTareKg) * defaultRatePerKg)}
              </div>
            </div>
          )}

          {speechError && (
            <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-2.5 text-xs text-red-300">
              {speechError}
            </div>
          )}
        </div>

        {/* Instant 1-Tap Spoken Voice Presets */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-[11px] text-slate-400 space-y-1.5">
          <span className="font-semibold text-slate-300 block">১-ট্যাপ টেস্ট ভয়েস বোতাম:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              `${activeBuyer} ৩৫ কেজি ২০০ গ্রাম`,
              `${activeBuyer} ৪২ কেজি ৫০০ গ্রাম ১৫ পিস`,
              `রফিক ৩৮ কেজি ১০০ গ্রাম`,
              `সুমন ৫০ কেজি`,
              `৩৭.৫ কেজি`,
            ].map((phrase) => (
              <button
                key={phrase}
                onClick={() => {
                  setTranscriptInput(phrase);
                  handleProcessAndCommit(phrase);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
              >
                "{phrase}"
              </button>
            ))}
          </div>
        </div>

        {/* Last Added Entry Undo Banner */}
        {lastAddedEntry && (
          <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                সর্বশেষ যোগ: <strong>{lastAddedEntry.buyerName}</strong> (দারি #{lastAddedEntry.dariNo}) -{' '}
                <strong className="font-mono-num">{lastAddedEntry.totalGrossKg}</strong> কেজি (নিট{' '}
                <strong className="font-mono-num">{lastAddedEntry.netKg}</strong> কেজি) = ৳
                {lastAddedEntry.totalPrice.toLocaleString('bn-BD')}
              </span>
            </div>
            <button
              onClick={onUndoLastEntry}
              className="ml-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-semibold flex items-center gap-1 transition-colors shrink-0 text-[11px]"
            >
              <RotateCcw className="w-3 h-3" /> বাতিল (Undo)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
