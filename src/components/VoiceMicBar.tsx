import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, RefreshCw, Volume2, Sparkles, CheckCircle2, RotateCcw, Play, Square } from 'lucide-react';
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
  const [isHandsFree, setIsHandsFree] = useState(settings.enableAutoHandsFree);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsePreview, setParsePreview] = useState<VoiceParseResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('ফোন স্কেলের পাশে রাখুন ও মুখে বলুন');
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTranscriptRef = useRef('');

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('আপনার ব্রাউজারে স্পিচ রিকগনিশন সমর্থন করে না। আপনি ম্যানুয়াল এন্ট্রি ব্যবহার করতে পারেন।');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'bn-BD'; // Primary Bengali Bangladesh

    recognition.onstart = () => {
      setIsListening(true);
      setStatusMessage('মাইক চালু আছে... মুখে বলুন (যেমন: নাইম ৩৫ কেজি ২০০ গ্রাম)');
      setSpeechError(null);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const currentText = final || interim;
      setTranscript(currentText);
      currentTranscriptRef.current = currentText;

      // Real-time preview parse
      if (currentText.trim().length > 3) {
        const preview = parseBengaliVoiceClientSide(currentText, activeBuyer, defaultRatePerKg);
        setParsePreview(preview);
      }

      // If user stops talking for 1.8s in Hands-Free mode, commit automatically!
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (currentText.trim().length > 4) {
        silenceTimerRef.current = setTimeout(() => {
          handleProcessAndCommit(currentText);
        }, 1800);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setStatusMessage('কোনো কথা শোনা যায়নি। আবার মুখে বলুন...');
      } else if (event.error === 'not-allowed') {
        setSpeechError('মাইক্রোফোন পারমিশন প্রয়োজন। ব্রাউজার সেটিংসে মাইক অ্যালাউ করুন।');
        setIsListening(false);
      } else {
        setStatusMessage('ভয়েস সিগন্যাল পুনঃসংযোগ করা হচ্ছে...');
      }
    };

    recognition.onend = () => {
      // If hands-free mode is on and user didn't manually stop it, restart automatically
      if (isHandsFree && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isHandsFree, activeBuyer, defaultRatePerKg]);

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
      setTranscript('');
      setParsePreview(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          setSpeechError('মাইক চালু করতে ব্যর্থ হয়েছে।');
        }
      }
    }
  };

  // Process spoken transcript via Gemini API or local Bengali parser
  const handleProcessAndCommit = async (textToProcess?: string) => {
    const rawText = textToProcess || transcript || currentTranscriptRef.current;
    if (!rawText || rawText.trim().length < 3) return;

    setIsProcessing(true);
    setStatusMessage('ভয়েস ডাটা বিশ্লেষণ করা হচ্ছে...');

    let parsedResult: VoiceParseResult | null = null;

    try {
      // Try Gemini Server Endpoint first for 100% voice precision
      const res = await fetch('/api/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: rawText,
          currentBuyer: activeBuyer,
          defaultTareKg,
          defaultRate: defaultRatePerKg,
        }),
      });
      const resData = await res.json();
      if (resData.success && resData.data && resData.data.weightKg > 0) {
        parsedResult = resData.data;
      }
    } catch (err) {
      console.warn('Backend Gemini parse failed, falling back to client parser:', err);
    }

    // Fallback to fast client-side Bengali parser if server call unavailable
    if (!parsedResult || parsedResult.weightKg <= 0) {
      parsedResult = parseBengaliVoiceClientSide(rawText, activeBuyer, defaultRatePerKg);
    }

    setIsProcessing(false);

    if (parsedResult && parsedResult.weightKg > 0) {
      // Calculate net weight
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

      onAddDariEntry(entryData);

      // Sound & Haptic Feedback
      if (settings.enableAudioChime) {
        audioManager.playSuccessChime();
        audioManager.vibrate(120);
      }

      // Spoken Feedback if enabled
      if (settings.enableTtsSpeak) {
        const spokenMsg = `${entryData.buyerName} ${entryData.grossKg} কেজি ${entryData.grossGrams} গ্রাম সংরক্ষিত হয়েছে।`;
        audioManager.speakBengali(spokenMsg);
      }

      setStatusMessage(`✅ ${entryData.buyerName}: ${entryData.totalGrossKg} কেজি (নিট ${entryData.netKg} কেজি) যুক্ত হয়েছে!`);
      setTranscript('');
      setParsePreview(null);
      currentTranscriptRef.current = '';
    } else {
      if (settings.enableAudioChime) {
        audioManager.playErrorChime();
      }
      setStatusMessage('❌ ওজন স্পষ্ট বোঝা যায়নি। আবার স্পষ্ট করে বলুন (যেমন: "নাইম ৩৫ কেজি ২০০ গ্রাম")');
    }
  };

  return (
    <div className="bg-slate-900 px-4 py-4 border-b border-slate-800">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Voice Control Main Card */}
        <div className="relative bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl overflow-hidden">
          {/* Subtle background glow when mic is active */}
          {isListening && (
            <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-3xl animate-pulse pointer-events-none" />
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            {/* Left: Big iOS Microphone Button */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 shrink-0 ${
                  isListening
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30 animate-mic-pulse scale-105'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-2 border-slate-700'
                }`}
              >
                {isProcessing ? (
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                ) : isListening ? (
                  <>
                    <Mic className="w-8 h-8 animate-bounce text-white" />
                    <span className="text-[10px] font-bold mt-1">রেকর্ডিং...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8 text-emerald-400" />
                    <span className="text-[10px] font-medium text-slate-400 mt-1">মাইক চাপুন</span>
                  </>
                )}
              </button>

              {/* Live Audio Waveform & Status */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    {isListening ? 'ভয়েস রিসিভার সক্রিয়' : 'ভয়েস কমান্ড বন্ধ'}
                  </span>

                  {/* Hands-Free Mode Tag */}
                  <button
                    onClick={() => setIsHandsFree(!isHandsFree)}
                    className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                      isHandsFree
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    হ্যান্ডস-ফ্রি {isHandsFree ? 'চালু' : 'বন্ধ'}
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-snug">{statusMessage}</p>

                {/* Animated sound wave bars when listening */}
                {isListening && (
                  <div className="flex items-center gap-1 pt-1 h-6">
                    <div className="w-1 bg-emerald-400 rounded-full animate-wave-1" />
                    <div className="w-1 bg-emerald-400 rounded-full animate-wave-2" />
                    <div className="w-1 bg-emerald-400 rounded-full animate-wave-3" />
                    <div className="w-1 bg-emerald-400 rounded-full animate-wave-4" />
                    <div className="w-1 bg-emerald-400 rounded-full animate-wave-5" />
                    <span className="text-[11px] font-mono text-emerald-400 ml-1">শুনছি...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Manual Input Modal Trigger */}
            <div className="w-full sm:w-auto flex items-center justify-end gap-2 border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
              <button
                onClick={onOpenManualModal}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span>+ ম্যানুয়াল টাইপ</span>
              </button>
            </div>
          </div>

          {/* Transcript Preview Box */}
          {transcript && (
            <div className="mt-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> মুখে বলা বাক্য:
                </span>
                <button
                  onClick={() => handleProcessAndCommit()}
                  disabled={isProcessing}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> সংরক্ষন করুন
                </button>
              </div>

              <p className="text-sm font-semibold text-emerald-200 font-mono-num bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                "{transcript}"
              </p>

              {/* Instant parsed preview */}
              {parsePreview && parsePreview.weightKg > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-1">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                    খদ্দের: <strong>{parsePreview.buyerName}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono-num font-bold">
                    কাঁচা ওজন: {parsePreview.weightKg} কেজি ({parsePreview.grossKg} কেজি {parsePreview.grossGrams} গ্রাম)
                  </span>
                  {parsePreview.birdCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                      মুরগি: {parsePreview.birdCount} পিস
                    </span>
                  )}
                  {parsePreview.ratePerKg > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300">
                      দর: ৳{parsePreview.ratePerKg}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Speech Error Banner */}
          {speechError && (
            <div className="mt-3 bg-red-950/40 border border-red-800/50 rounded-xl p-3 text-xs text-red-300">
              {speechError}
            </div>
          )}
        </div>

        {/* Voice Example Prompt Hints */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-300">ভয়েস উদাহরণ:</span>
          <button
            onClick={() => handleProcessAndCommit('নাইম ৩৫ কেজি ২০০ গ্রাম')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
          >
            "নাইম ৩৫ কেজি ২০০ গ্রাম"
          </button>
          <button
            onClick={() => handleProcessAndCommit('রফিক ২ নম্বর ৪২ কেজি ৫০০ গ্রাম ১৫ পিস')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
          >
            "রফিক ২ নম্বর ৪২ কেজি ৫০০ গ্রাম"
          </button>
          <button
            onClick={() => handleProcessAndCommit('৩৮ কেজি ১০০ গ্রাম')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
          >
            "৩৮ কেজি ১০০ গ্রাম"
          </button>
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
