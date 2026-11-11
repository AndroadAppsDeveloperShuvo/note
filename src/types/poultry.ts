export interface DariEntry {
  id: string;
  dariNo: number;
  buyerName: string;
  grossKg: number;      // e.g. 35
  grossGrams: number;   // e.g. 200
  totalGrossKg: number; // e.g. 35.2
  tareKg: number;       // Crate weight to subtract e.g. 2.0
  netKg: number;        // Net chicken weight = 35.2 - 2.0 = 33.2
  birdCount: number;    // Number of chickens (pices)
  ratePerKg: number;    // Rate per kg in BDT (৳)
  totalPrice: number;   // netKg * ratePerKg
  timestamp: number;
  notes?: string;
  isVoiceEntry?: boolean;
}

export interface BuyerSummary {
  buyerName: string;
  totalDari: number;
  totalGrossKg: number;
  totalTareKg: number;
  totalNetKg: number;
  totalBirds: number;
  avgBirdWeight: number; // netKg / totalBirds
  ratePerKg: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  entries: DariEntry[];
}

export interface SalesSession {
  id: string;
  title: string; // e.g. "আজকের বিক্রি - ১০ নভেম্বর ২০২৬"
  date: string;
  defaultTareKg: number;    // Default cage tare weight (e.g. 2.0 kg)
  defaultRatePerKg: number; // Default rate per kg (e.g. 170 ৳)
  entries: DariEntry[];
  payments: Record<string, number>; // buyerName -> paid BDT
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VoiceParseResult {
  buyerName: string;
  dariNo: number | null;
  weightKg: number;
  grossKg: number;
  grossGrams: number;
  birdCount: number;
  ratePerKg: number;
  confidenceNote?: string;
}
