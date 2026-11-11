import React, { useState } from 'react';
import { BuyerSummary, DariEntry } from '../types/poultry';
import { User, Printer, Share2, Copy, Check, DollarSign, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface BuyerSummaryCardsProps {
  buyerSummaries: BuyerSummary[];
  onUpdatePayment: (buyerName: string, paidAmount: number) => void;
  onOpenCashMemoModal: (buyerSummary: BuyerSummary) => void;
}

export const BuyerSummaryCards: React.FC<BuyerSummaryCardsProps> = ({
  buyerSummaries,
  onUpdatePayment,
  onOpenCashMemoModal,
}) => {
  const [copiedBuyer, setCopiedBuyer] = useState<string | null>(null);
  const [expandedBuyer, setExpandedBuyer] = useState<string | null>(null);

  const handleCopyWhatsAppMemo = (summary: BuyerSummary) => {
    let text = `🐔 *পোল্ট্রি বিক্রি ক্যাশ মেমো*\n`;
    text += `👤 *খদ্দের:* ${summary.buyerName}\n`;
    text += `📦 *মোট Dari (খাঁচা):* ${summary.totalDari} টি\n`;
    text += `⚖️ *মোট নিট ওজন:* ${summary.totalNetKg.toFixed(3)} কেজি\n`;
    if (summary.totalBirds > 0) {
      text += `🐥 *মোট মুরগি:* ${summary.totalBirds} পিস (গড়: ${summary.avgBirdWeight.toFixed(2)} কেজি)\n`;
    }
    text += `🏷️ *দর:* ৳${summary.ratePerKg} /কেজি\n`;
    text += `---------------------------\n`;
    text += `💰 *মোট টাকা:* ৳${summary.totalAmount.toLocaleString('bn-BD')}\n`;
    text += `💵 *জমা টাকা:* ৳${summary.paidAmount.toLocaleString('bn-BD')}\n`;
    text += `⚠️ *বাকি টাকা:* ৳${summary.dueAmount.toLocaleString('bn-BD')}\n\n`;
    text += `ধন্যবাদ! 🐔`;

    navigator.clipboard.writeText(text);
    setCopiedBuyer(summary.buyerName);
    setTimeout(() => setCopiedBuyer(null), 2500);
  };

  if (buyerSummaries.length === 0) return null;

  return (
    <div className="bg-slate-900 px-4 py-4 space-y-3">
      <div className="max-w-4xl mx-auto space-y-3">
        <h2 className="text-sm font-bold text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-emerald-400" /> খদ্দের অনুযায়ী মেমো ও পাওনা হিসাব
          </span>
          <span className="text-xs text-slate-400 font-normal">
            মোট {buyerSummaries.length} জন খদ্দের
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {buyerSummaries.map((summary) => {
            const isExpanded = expandedBuyer === summary.buyerName;

            return (
              <div
                key={summary.buyerName}
                className="bg-gradient-to-b from-slate-800 to-slate-850 border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-lg"
              >
                {/* Header: Buyer Name & Total Dari */}
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                      {summary.buyerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">{summary.buyerName}</h3>
                      <p className="text-xs text-slate-400">
                        {summary.totalDari} টি Dari · {summary.totalBirds > 0 ? `${summary.totalBirds} পিস` : 'সব পোল্ট্রি'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">মোট নিট কেজি</span>
                    <strong className="text-base font-bold text-emerald-400 font-mono-num">
                      {summary.totalNetKg.toFixed(3)}
                    </strong>
                  </div>
                </div>

                {/* Key Numbers Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
                  <div>
                    <span className="text-slate-400 block">মোট দর/কেজি</span>
                    <strong className="text-amber-300 font-mono-num">৳{summary.ratePerKg}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">গড় ওজন/পিস</span>
                    <strong className="text-slate-200 font-mono-num">
                      {summary.avgBirdWeight > 0 ? `${summary.avgBirdWeight.toFixed(2)} কেজি` : '-'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">মোট টাকা</span>
                    <strong className="text-amber-300 font-mono-num font-bold text-sm">
                      ৳{summary.totalAmount.toLocaleString('bn-BD')}
                    </strong>
                  </div>
                </div>

                {/* Payment Input (Cash Paid & Due) */}
                <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-medium whitespace-nowrap">নগদ জমা (৳):</span>
                    <input
                      type="number"
                      min="0"
                      value={summary.paidAmount || ''}
                      onChange={(e) => onUpdatePayment(summary.buyerName, parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 font-mono-num text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block">বাকি টাকা</span>
                    <strong
                      className={`font-mono-num text-sm font-bold ${
                        summary.dueAmount > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      ৳{summary.dueAmount.toLocaleString('bn-BD')}
                    </strong>
                  </div>
                </div>

                {/* Actions: Print Memo, WhatsApp Share */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onOpenCashMemoModal(summary)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" /> ক্যাশ মেমো
                  </button>

                  <button
                    onClick={() => handleCopyWhatsAppMemo(summary)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedBuyer === summary.buyerName ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> কপি হয়েছে!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" /> হোয়াটসঅ্যাপ
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setExpandedBuyer(isExpanded ? null : summary.buyerName)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Dari Details */}
                {isExpanded && (
                  <div className="mt-3 border-t border-slate-700/60 pt-3 space-y-1.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400 block">Dari তালিকা:</span>
                    {summary.entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg">
                        <span>
                          Dari #{entry.dariNo}: কাঁচা {entry.totalGrossKg} kg - {entry.tareKg} kg খাঁচা ={' '}
                          <strong className="text-emerald-400 font-mono-num">{entry.netKg} kg</strong>
                        </span>
                        <span className="font-mono-num text-amber-300">৳{entry.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
