import { VoiceParseResult } from '../types/poultry';

// Map of Bengali digits to English
const BENGALI_TO_ENGLISH_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

// Map of spoken Bengali number words to numeric values
const BENGALI_NUMBER_WORDS: Record<string, number> = {
  'শূন্য': 0, 'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5,
  'ছয়': 6, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'নয়': 9, 'দশ': 10,
  'এগারো': 11, 'বারো': 12, 'তেরো': 13, 'চৌদ্দ': 14, 'পনেরো': 15, 'পনের': 15,
  'ষোল': 16, 'সতেরো': 17, 'আঠারো': 18, 'উন্নিশ': 19, 'বিশ': 20,
  'একুশ': 21, 'বাইশ': 22, 'তেইশ': 23, 'চব্বিশ': 24, 'পঁচিশ': 25,
  'ছাব্বিশ': 26, 'সাতাশ': 27, 'আটাশ': 28, 'উনত্রিশ': 29, 'ত্রিশ': 30,
  'একত্রিশ': 31, 'বত্রিশ': 32, 'তেত্রিশ': 33, 'চৌত্রিশ': 34, 'পঁয়ত্রিশ': 35,
  'পয়ত্রিশ': 35, 'ছত্রিশ': 36, 'সাইত্রিশ': 37, 'আটত্রিশ': 38, '৩৯': 39,
  'চল্লিশ': 40, 'একচল্লিশ': 41, 'বিয়াল্লিশ': 42, 'বিয়াল্লিশ': 42, 'তেতাল্লিশ': 43,
  'চৌয়াল্লিশ': 44, 'পয়তাল্লিশ': 45, 'পঁয়তাল্লিশ': 45, 'ছেচল্লিশ': 46, 'সাতচল্লিশ': 47,
  'আটচল্লিশ': 48, 'উনপঞ্চাশ': 49, 'পঞ্চাশ': 50, 'একান্ন': 51, 'বায়ান্ন': 52,
  'তিপ্পান্ন': 53, 'চৌয়ান্ন': 54, 'পঞ্চান্ন': 55, 'ছাপ্পান্ন': 56, 'সাতান্ন': 57,
  'আটান্ন': 58, 'উনষাট': 59, 'ষাট': 60, 'একষট্টি': 61, 'বাষট্টি': 62,
  'তেষট্টি': 63, 'চৌষট্টি': 64, 'পঁয়ষট্টি': 65, 'ছেষট্টি': 66, 'সাতষট্টি': 67,
  'আটষট্টি': 68, 'উনসত্তর': 69, 'সত্তর': 70, 'একাত্তর': 71, 'বাহাত্তর': 72,
  'তেহাত্তর': 73, 'চুয়াত্তর': 74, 'পঁচাত্তর': 75, 'ছিয়াাত্তর': 76, 'সাতাত্তর': 77,
  'আটাত্তর': 78, 'উনাশি': 79, 'আশি': 80, 'একাশি': 81, 'বিরাশি': 82,
  'তিরাশি': 83, 'চৌরাশি': 84, 'পঁচাশির': 85, 'পঁচাশি': 85, 'ছিয়াশি': 86, 'সাতাশি': 87,
  'অষ্টাশির': 88, 'আটাশি': 88, 'নাইনানব্বই': 89, 'নব্বই': 90, 'একানব্বই': 91,
  'বিরানব্বই': 92, 'তিরানব্বই': 93, 'চৌরানব্বই': 94, 'পঁচানব্বই': 95, 'ছিয়ানব্বই': 96,
  'সাতানব্বই': 97, 'আটানব্বই': 98, 'নিনানব্বই': 99, 'একশো': 100, 'একশত': 100,
  'দুইশো': 200, 'দুইশত': 200, 'তিনশো': 300, 'তিনশত': 300, 'চারশো': 400,
  'পাঁচশো': 500, 'ছয়শো': 600, 'সাতশো': 700, 'আটশো': 800, 'নয়শো': 900
};

export function convertBengaliDigitsToEnglish(str: string): string {
  return str.replace(/[০-৯]/g, (w) => BENGALI_TO_ENGLISH_DIGITS[w] || w);
}

export function parseBengaliVoiceClientSide(
  rawTranscript: string,
  currentBuyer: string = 'সাধারণ খদ্দের',
  defaultRate: number = 0
): VoiceParseResult {
  const text = convertBengaliDigitsToEnglish(rawTranscript.trim().toLowerCase());

  let buyerName = currentBuyer;
  let dariNo: number | null = null;
  let grossKg = 0;
  let grossGrams = 0;
  let birdCount = 0;
  let ratePerKg = defaultRate;

  // 1. Check for Buyer name at start or before 'কেজি'
  // Common buyer names: নাইম, রফিক, সুমন, লিটন, আলম, বাবুল, কালাম, জলিল, সেলিম
  const buyerMatch = text.match(/(নাইম|রফিক|সুমন|লিটন|আলম|বাবুল|কালাম|জলিল|সেলিম|খদ্দের|ভাই|সাহেব|[a-zঅ-ঔক-হয়ড়ঢ়য়ঁ-ৌ]+)\b/i);
  // Extract potential buyer before numbers if mentioned
  const words = text.split(/\s+/);
  if (words.length > 0 && !/\d/.test(words[0]) && !['কেজি', 'গ্রাম', 'পিস', 'দারি', 'খাঁচা'].includes(words[0])) {
    const candidate = words[0].replace(/(ের|এর|কে|দেয়)$/, '');
    if (candidate.length >= 2) {
      buyerName = candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  // 2. Check for Dari Number (e.g. "২ নম্বর", "দারি ৩")
  const dariMatch = text.match(/(?:দারি|খাঁচা|\bনং|\bনম্বর)\s*(\d+)|(\d+)\s*(?:নম্বর|নং)\s*দারি/i);
  if (dariMatch) {
    dariNo = parseInt(dariMatch[1] || dariMatch[2], 10);
  }

  // 3. Extract Weight: KG & Grams
  // Pattern A: "৩৫ কেজি ২০০ গ্রাম" or "৩৫.২ কেজি" or "৩৫ কেজি ২ শো গ্রাম"
  const kgGramMatch = text.match(/(\d+(?:\.\d+)?)\s*কেজি(?:\s*(\d+)\s*গ্রাম)?/i);
  const gramOnlyMatch = text.match(/(\d+)\s*গ্রাম/i);
  const decimalMatch = text.match(/(\d+\.\d+)/);

  if (kgGramMatch) {
    const mainKgStr = kgGramMatch[1];
    if (mainKgStr.includes('.')) {
      const val = parseFloat(mainKgStr);
      grossKg = Math.floor(val);
      grossGrams = Math.round((val - grossKg) * 1000);
    } else {
      grossKg = parseInt(mainKgStr, 10);
      if (kgGramMatch[2]) {
        grossGrams = parseInt(kgGramMatch[2], 10);
      }
    }
  } else if (decimalMatch) {
    const val = parseFloat(decimalMatch[1]);
    grossKg = Math.floor(val);
    grossGrams = Math.round((val - grossKg) * 1000);
  } else {
    // Try matching spoken Bengali number words if digits weren't present
    for (const [word, val] of Object.entries(BENGALI_NUMBER_WORDS)) {
      if (text.includes(word + ' কেজি') || text.includes(word + 'কেজি')) {
        grossKg = val;
        break;
      }
    }
    // Check grams in words
    for (const [word, val] of Object.entries(BENGALI_NUMBER_WORDS)) {
      if (text.includes(word + ' গ্রাম') || text.includes(word + 'গ্রাম')) {
        grossGrams = val;
        break;
      }
    }
  }

  // If grossGrams missing but gram pattern was found separately
  if (grossGrams === 0 && gramOnlyMatch && !kgGramMatch?.[2]) {
    grossGrams = parseInt(gramOnlyMatch[1], 10);
  }

  // Handle "সাড়ে" (e.g. সাড়ে ৩৫ -> 35.5)
  if (text.includes('সাড়ে') || text.includes('সারে')) {
    if (grossGrams === 0) grossGrams = 500;
  }
  // Handle "সোয়া" (e.g. সোয়া ৩৫ -> 35.25)
  if (text.includes('সোয়া') || text.includes('সোয়া')) {
    if (grossGrams === 0) grossGrams = 250;
  }
  // Handle "পৌনে" (e.g. পৌনে ৩৫ -> 34.75)
  if (text.includes('পৌনে')) {
    if (grossKg > 0) grossKg -= 1;
    grossGrams = 750;
  }

  // 4. Bird count (পিস / সংখ্যা / টা)
  const birdMatch = text.match(/(\d+)\s*(?:পিস|টা|টি|মুরগি)/i);
  if (birdMatch) {
    birdCount = parseInt(birdMatch[1], 10);
  }

  // 5. Rate per kg (দর / টাকা)
  const rateMatch = text.match(/(?:দর|টাকা|রেট)\s*(\d+)|(\d+)\s*(?:টাকা|দর)/i);
  if (rateMatch) {
    const r = parseInt(rateMatch[1] || rateMatch[2], 10);
    if (r >= 50 && r <= 1000) {
      ratePerKg = r;
    }
  }

  const weightKg = Number((grossKg + grossGrams / 1000).toFixed(3));

  return {
    buyerName: buyerName || 'সাধারণ খদ্দের',
    dariNo,
    weightKg,
    grossKg,
    grossGrams,
    birdCount,
    ratePerKg,
    confidenceNote: 'দ্রুত লোকাল ভয়েস পার্সিং সফল',
  };
}
