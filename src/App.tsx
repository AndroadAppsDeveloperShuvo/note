import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ActivePresetBar } from './components/ActivePresetBar';
import { VoiceMicBar } from './components/VoiceMicBar';
import { DariTable } from './components/DariTable';
import { BuyerSummaryCards } from './components/BuyerSummaryCards';
import { QuickManualModal } from './components/QuickManualModal';
import { CashMemoModal } from './components/CashMemoModal';
import { SettingsModal } from './components/SettingsModal';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { SessionHistoryModal } from './components/SessionHistoryModal';
import { AddBuyerModal } from './components/AddBuyerModal';
import { EditTareModal } from './components/EditTareModal';
import { EditRateModal } from './components/EditRateModal';

import { DariEntry, BuyerSummary, SalesSession } from './types/poultry';
import {
  loadSessions,
  saveSessions,
  loadSettings,
  saveSettings,
  createNewSession,
  AppSettings,
} from './utils/storage';
import {
  testFirebaseConnection,
  subscribeSessions,
  saveSessionToFirestore,
  deleteEntryFromFirestore,
  deleteSessionFromFirestore,
} from './firebase';
import { Calendar, FileSpreadsheet, CloudCheck } from 'lucide-react';

export default function App() {
  const [sessions, setSessions] = useState<SalesSession[]>(() => loadSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const list = loadSessions();
    return list[0]?.id || 'session_1';
  });
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [activeBuyer, setActiveBuyer] = useState<string>('নাইম');

  // Modals visibility state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DariEntry | null>(null);
  const [isCashMemoOpen, setIsCashMemoOpen] = useState(false);
  const [memoBuyerSummary, setMemoBuyerSummary] = useState<BuyerSummary | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isIPhoneFrame, setIsIPhoneFrame] = useState(false);

  // Custom interactive modals replacing window.prompt
  const [isAddBuyerModalOpen, setIsAddBuyerModalOpen] = useState(false);
  const [isEditTareModalOpen, setIsEditTareModalOpen] = useState(false);
  const [isEditRateModalOpen, setIsEditRateModalOpen] = useState(false);

  // Undo memory
  const [lastAddedEntry, setLastAddedEntry] = useState<DariEntry | null>(null);

  // Test and sync Firestore on mount
  useEffect(() => {
    testFirebaseConnection();

    // Subscribe to Firestore real-time updates
    const unsubscribe = subscribeSessions((cloudSessions) => {
      if (cloudSessions && cloudSessions.length > 0) {
        setSessions(cloudSessions);
      }
    });

    return () => unsubscribe();
  }, []);

  // Get Active Session object
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || createNewSession();
  }, [sessions, activeSessionId]);

  // Persist local settings changes
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Derive unique buyers list
  const buyerList = useMemo(() => {
    const set = new Set<string>();
    set.add('নাইম');
    set.add('রফিক');
    set.add('সুমন');
    set.add('আলম');
    set.add('লিটন');

    activeSession.entries.forEach((e) => set.add(e.buyerName));
    Object.keys(activeSession.payments || {}).forEach((b) => set.add(b));
    return Array.from(set);
  }, [activeSession]);

  // Set active buyer if not in list
  useEffect(() => {
    if (!buyerList.includes(activeBuyer)) {
      setActiveBuyer(buyerList[0] || 'নাইম');
    }
  }, [buyerList]);

  // Add or Update Dari Entry (Local + Firestore Sync)
  const handleSaveDariEntry = (entryPartial: Partial<DariEntry>) => {
    const currentEntries = [...activeSession.entries];
    let updatedEntries: DariEntry[];
    let savedItem: DariEntry;

    if (entryPartial.id) {
      // Edit existing
      updatedEntries = currentEntries.map((e) => {
        if (e.id === entryPartial.id) {
          const updated = { ...e, ...entryPartial } as DariEntry;
          savedItem = updated;
          return updated;
        }
        return e;
      });
    } else {
      // Add new
      const nextDariNo = entryPartial.dariNo || currentEntries.length + 1;
      const newEntry: DariEntry = {
        id: 'dari_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        dariNo: nextDariNo,
        buyerName: entryPartial.buyerName || activeBuyer,
        grossKg: entryPartial.grossKg || 0,
        grossGrams: entryPartial.grossGrams || 0,
        totalGrossKg: entryPartial.totalGrossKg || 0,
        tareKg: entryPartial.tareKg ?? activeSession.defaultTareKg,
        netKg: entryPartial.netKg || 0,
        birdCount: entryPartial.birdCount || 0,
        ratePerKg: entryPartial.ratePerKg || activeSession.defaultRatePerKg,
        totalPrice: entryPartial.totalPrice || 0,
        timestamp: Date.now(),
        isVoiceEntry: entryPartial.isVoiceEntry || false,
      };
      updatedEntries = [...currentEntries, newEntry];
      savedItem = newEntry;
      setLastAddedEntry(newEntry);
    }

    const updatedSession: SalesSession = {
      ...activeSession,
      entries: updatedEntries,
      updatedAt: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? updatedSession : s))
    );

    // Save to Firestore Database
    saveSessionToFirestore(updatedSession);
  };

  // Undo Last Added Entry
  const handleUndoLastEntry = () => {
    if (!lastAddedEntry) return;

    const updatedEntries = activeSession.entries.filter((e) => e.id !== lastAddedEntry.id);
    const updatedSession = { ...activeSession, entries: updatedEntries, updatedAt: Date.now() };

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? updatedSession : s))
    );

    deleteEntryFromFirestore(activeSession.id, lastAddedEntry.id);
    setLastAddedEntry(null);
  };

  // Delete Entry
  const handleDeleteEntry = (id: string) => {
    const updatedEntries = activeSession.entries.filter((e) => e.id !== id);
    const updatedSession = { ...activeSession, entries: updatedEntries, updatedAt: Date.now() };

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? updatedSession : s))
    );

    deleteEntryFromFirestore(activeSession.id, id);
  };

  // Duplicate Entry
  const handleDuplicateEntry = (entry: DariEntry) => {
    handleSaveDariEntry({
      ...entry,
      id: undefined,
      dariNo: activeSession.entries.length + 1,
      timestamp: Date.now(),
    });
  };

  // Update Buyer Payment amount
  const handleUpdatePayment = (buyerName: string, paidAmount: number) => {
    const updatedSession = {
      ...activeSession,
      payments: {
        ...(activeSession.payments || {}),
        [buyerName]: paidAmount,
      },
      updatedAt: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? updatedSession : s))
    );

    saveSessionToFirestore(updatedSession);
  };

  // Compute Buyer Summaries
  const buyerSummaries: BuyerSummary[] = useMemo(() => {
    const map = new Map<string, DariEntry[]>();

    activeSession.entries.forEach((e) => {
      const list = map.get(e.buyerName) || [];
      list.push(e);
      map.set(e.buyerName, list);
    });

    const result: BuyerSummary[] = [];

    map.forEach((entries, bName) => {
      const totalDari = entries.length;
      const totalGrossKg = entries.reduce((acc, e) => acc + e.totalGrossKg, 0);
      const totalTareKg = entries.reduce((acc, e) => acc + e.tareKg, 0);
      const totalNetKg = entries.reduce((acc, e) => acc + e.netKg, 0);
      const totalBirds = entries.reduce((acc, e) => acc + e.birdCount, 0);
      const avgBirdWeight = totalBirds > 0 ? totalNetKg / totalBirds : 0;
      const ratePerKg = entries[entries.length - 1]?.ratePerKg || activeSession.defaultRatePerKg;
      const totalAmount = entries.reduce((acc, e) => acc + e.totalPrice, 0);
      const paidAmount = activeSession.payments?.[bName] || 0;
      const dueAmount = Math.max(0, totalAmount - paidAmount);

      result.push({
        buyerName: bName,
        totalDari,
        totalGrossKg,
        totalTareKg,
        totalNetKg,
        totalBirds,
        avgBirdWeight,
        ratePerKg,
        totalAmount,
        paidAmount,
        dueAmount,
        entries,
      });
    });

    return result;
  }, [activeSession]);

  // Overall batch metrics
  const totalBatchMetrics = useMemo(() => {
    const totalDari = activeSession.entries.length;
    const totalGrossKg = activeSession.entries.reduce((sum, e) => sum + e.totalGrossKg, 0);
    const totalNetKg = activeSession.entries.reduce((sum, e) => sum + e.netKg, 0);
    const totalBirds = activeSession.entries.reduce((sum, e) => sum + e.birdCount, 0);
    const avgBirdWeight = totalBirds > 0 ? totalNetKg / totalBirds : 0;
    const totalAmount = activeSession.entries.reduce((sum, e) => sum + e.totalPrice, 0);

    return { totalDari, totalGrossKg, totalNetKg, totalBirds, avgBirdWeight, totalAmount };
  }, [activeSession]);

  // Active filter state for Dari Table
  const [activeFilterBuyer, setActiveFilterBuyer] = useState<string>('ALL');

  // Handle saving new buyer name
  const handleAddNewBuyerName = (name: string) => {
    setActiveBuyer(name);
  };

  // Handle saving tare weight
  const handleSaveTareWeight = (tareKg: number) => {
    const updated = { ...activeSession, defaultTareKg: tareKg };
    setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? updated : s)));
    saveSessionToFirestore(updated);
  };

  // Handle saving rate per kg
  const handleSaveRatePerKg = (ratePerKg: number) => {
    const updated = { ...activeSession, defaultRatePerKg: ratePerKg };
    setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? updated : s)));
    saveSessionToFirestore(updated);
  };

  // Export CSV Report
  const handleExportCsv = () => {
    let csv = 'Dari No,Buyer Name,Gross Weight (kg),Tare Weight (kg),Net Weight (kg),Birds,Rate/kg,Total Price (BDT)\n';
    activeSession.entries.forEach((e) => {
      csv += `${e.dariNo},"${e.buyerName}",${e.totalGrossKg},${e.tareKg},${e.netKg},${e.birdCount},${e.ratePerKg},${e.totalPrice}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSession.title.replace(/\s+/g, '_')}_sales_report.csv`;
    a.click();
  };

  // Render Inner Content
  const renderAppContent = () => (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      {/* Top Header */}
      <Header
        settings={settings}
        onUpdateSettings={(newSet) => setSettings({ ...settings, ...newSet })}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onToggleIPhoneFrame={() => setIsIPhoneFrame(!isIPhoneFrame)}
        isIPhoneFrame={isIPhoneFrame}
        totalSessionsCount={sessions.length}
      />

      {/* Firebase Cloud Live Badge Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
          <CloudCheck className="w-3.5 h-3.5" />
          <span>ফায়ারবেস ক্লাউড সেভ সক্রিয় (drivebot-d2a27)</span>
        </div>

        <button
          onClick={() => setIsHistoryModalOpen(true)}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white font-bold bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2.5 py-1 rounded-lg transition-colors text-[11px]"
        >
          <Calendar className="w-3 h-3 text-emerald-400" />
          <span>{activeSession.title}</span>
        </button>
      </div>

      {/* Active Preset & Live Totals Bar */}
      <ActivePresetBar
        activeBuyer={activeBuyer}
        onChangeBuyer={setActiveBuyer}
        buyerList={buyerList}
        onAddNewBuyer={() => setIsAddBuyerModalOpen(true)}
        tareKg={activeSession.defaultTareKg}
        onEditTare={() => setIsEditTareModalOpen(true)}
        ratePerKg={activeSession.defaultRatePerKg}
        onEditRate={() => setIsEditRateModalOpen(true)}
        totalGrossKg={totalBatchMetrics.totalGrossKg}
        totalNetKg={totalBatchMetrics.totalNetKg}
        totalAmount={totalBatchMetrics.totalAmount}
        totalDariCount={totalBatchMetrics.totalDari}
      />

      {/* Primary Voice Mic Control Center */}
      <VoiceMicBar
        activeBuyer={activeBuyer}
        defaultTareKg={activeSession.defaultTareKg}
        defaultRatePerKg={activeSession.defaultRatePerKg}
        onAddDariEntry={handleSaveDariEntry}
        settings={settings}
        lastAddedEntry={lastAddedEntry}
        onUndoLastEntry={handleUndoLastEntry}
        onOpenManualModal={() => {
          setEditingEntry(null);
          setIsManualModalOpen(true);
        }}
      />

      {/* Main Content Areas */}
      <main className="flex-1 space-y-4">
        {/* Recorded Dari Table */}
        <DariTable
          entries={activeSession.entries}
          activeFilterBuyer={activeFilterBuyer}
          onSelectFilterBuyer={setActiveFilterBuyer}
          buyerList={buyerList}
          onDeleteEntry={handleDeleteEntry}
          onEditEntry={(entry) => {
            setEditingEntry(entry);
            setIsManualModalOpen(true);
          }}
          onDuplicateEntry={handleDuplicateEntry}
        />

        {/* Buyer Summary Breakdown & Digital Cash Memos */}
        <BuyerSummaryCards
          buyerSummaries={buyerSummaries}
          onUpdatePayment={handleUpdatePayment}
          onOpenCashMemoModal={(summary) => {
            setMemoBuyerSummary(summary);
            setIsCashMemoOpen(true);
          }}
        />
      </main>

      {/* Modals */}
      <QuickManualModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingEntry(null);
        }}
        activeBuyer={activeBuyer}
        buyerList={buyerList}
        defaultTareKg={activeSession.defaultTareKg}
        defaultRatePerKg={activeSession.defaultRatePerKg}
        onSaveEntry={handleSaveDariEntry}
        onAddNewBuyer={() => setIsAddBuyerModalOpen(true)}
        editingEntry={editingEntry}
      />

      <AddBuyerModal
        isOpen={isAddBuyerModalOpen}
        onClose={() => setIsAddBuyerModalOpen(false)}
        onAddBuyer={handleAddNewBuyerName}
      />

      <EditTareModal
        isOpen={isEditTareModalOpen}
        onClose={() => setIsEditTareModalOpen(false)}
        currentTareKg={activeSession.defaultTareKg}
        onSaveTare={handleSaveTareWeight}
      />

      <EditRateModal
        isOpen={isEditRateModalOpen}
        onClose={() => setIsEditRateModalOpen(false)}
        currentRate={activeSession.defaultRatePerKg}
        onSaveRate={handleSaveRatePerKg}
      />

      <CashMemoModal
        isOpen={isCashMemoOpen}
        onClose={() => setIsCashMemoOpen(false)}
        buyerSummary={memoBuyerSummary}
        session={activeSession}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onExportData={() => {}}
        onImportData={() => {}}
      />

      <AiAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        batchSummary={totalBatchMetrics}
      />

      <SessionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={(title) => {
          const newSess = createNewSession(title);
          setSessions((prev) => [newSess, ...prev]);
          setActiveSessionId(newSess.id);
          saveSessionToFirestore(newSess);
        }}
        onDeleteSession={(id) => {
          setSessions((prev) => prev.filter((s) => s.id !== id));
          deleteSessionFromFirestore(id);
        }}
        onExportCsv={handleExportCsv}
      />
    </div>
  );

  if (isIPhoneFrame) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-2 sm:p-6">
        <div className="relative w-full max-w-[410px] h-[870px] bg-slate-900 border-[12px] border-slate-800 rounded-[50px] shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-700">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center gap-2 px-3">
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto pt-6">
            {renderAppContent()}
          </div>

          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full z-50 pointer-events-none" />
        </div>
      </div>
    );
  }

  return renderAppContent();
}
