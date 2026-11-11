import React from 'react';
import { X, Printer, Download, Share2, Check } from 'lucide-react';
import { BuyerSummary, SalesSession } from '../types/poultry';

interface CashMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyerSummary: BuyerSummary | null;
  session: SalesSession;
}

export const CashMemoModal: React.FC<CashMemoModalProps> = ({
  isOpen,
  onClose,
  buyerSummary,
  session,
}) => {
  if (!isOpen || !buyerSummary) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Control Bar (Non-printable) */}
        <div className="bg-slate-800 p-3 flex items-center justify-between border-b border-slate-700 print:hidden">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            📄 ক্যাশ মেমো - {buyerSummary.buyerName}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> প্রিন্ট / পিসিএস
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-700 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Memo Content */}
        <div className="p-6 bg-white text-slate-900 space-y-4 overflow-y-auto font-sans print:p-4 print:text-black">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              মেসার্স বিসমিল্লাহ পোল্ট্রি খামার
            </h2>
            <p className="text-xs text-slate-600">সব ধরণের পাইকারী ও খুচরা ব্রয়লার, সোনালী ও কক মুরগি বিক্রেতা</p>
            <p className="text-[11px] text-slate-500 mt-0.5">তারিখ: {session.date}</p>
          </div>

          {/* Memo Meta */}
          <div className="flex justify-between text-xs font-semibold bg-slate-100 p-2.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px]">খদ্দেরের নাম:</span>
              <strong className="text-sm text-slate-900">{buyerSummary.buyerName}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px]">ভাউচার নম্বর:</span>
              <span className="font-mono text-slate-800">#MEMO-{Date.now().toString().slice(-4)}</span>
            </div>
          </div>

          {/* Dari Breakdown Table */}
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-200 text-slate-900 border-b border-slate-300">
                <th className="p-2 border border-slate-300 text-center">Dari #</th>
                <th className="p-2 border border-slate-300">কাঁচা ওজন (kg)</th>
                <th className="p-2 border border-slate-300 text-center">খাঁচা বাদ</th>
                <th className="p-2 border border-slate-300 text-right">নিট ওজন (kg)</th>
                <th className="p-2 border border-slate-300 text-right">দর (৳)</th>
                <th className="p-2 border border-slate-300 text-right">মোট টাকা</th>
              </tr>
            </thead>
            <tbody>
              {buyerSummary.entries.map((entry, idx) => (
                <tr key={entry.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-2 border border-slate-300 text-center font-bold">#{entry.dariNo}</td>
                  <td className="p-2 border border-slate-300 font-mono">{entry.totalGrossKg}</td>
                  <td className="p-2 border border-slate-300 text-center text-slate-600 font-mono">
                    {entry.tareKg} kg
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-bold font-mono text-emerald-800">
                    {entry.netKg.toFixed(3)}
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-mono">৳{entry.ratePerKg}</td>
                  <td className="p-2 border border-slate-300 text-right font-bold font-mono">
                    ৳{entry.totalPrice.toLocaleString('bn-BD')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900">
                <td colSpan={3} className="p-2 border border-slate-300 text-right">
                  সর্বমোট ({buyerSummary.totalDari} টি Dari):
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono text-emerald-900 text-sm">
                  {buyerSummary.totalNetKg.toFixed(3)} kg
                </td>
                <td className="p-2 border border-slate-300 text-right">গড় ৳{buyerSummary.ratePerKg}</td>
                <td className="p-2 border border-slate-300 text-right font-mono text-sm text-slate-900">
                  ৳{buyerSummary.totalAmount.toLocaleString('bn-BD')}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Payment Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-1/2 space-y-1 text-xs border border-slate-300 p-2.5 rounded-lg bg-slate-50">
              <div className="flex justify-between">
                <span>মোট বিল:</span>
                <strong className="font-mono">৳{buyerSummary.totalAmount.toLocaleString('bn-BD')}</strong>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>নগদ জমা:</span>
                <strong className="font-mono">৳{buyerSummary.paidAmount.toLocaleString('bn-BD')}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1 text-sm font-bold text-red-600">
                <span>অবশিষ্ট বাকি:</span>
                <strong className="font-mono">৳{buyerSummary.dueAmount.toLocaleString('bn-BD')}</strong>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-8 text-[11px] text-slate-600">
            <div className="text-center border-t border-slate-400 pt-1 w-28">ক্রেতার স্বাক্ষর</div>
            <div className="text-center border-t border-slate-400 pt-1 w-36">খামারের পক্ষে বিক্রেতা</div>
          </div>
        </div>
      </div>
    </div>
  );
};
