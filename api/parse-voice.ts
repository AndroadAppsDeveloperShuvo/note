import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { transcript, currentBuyer, defaultTareKg, defaultRate } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'ভয়েস টেক্সট প্রয়োজন' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `আপনি একটি পোল্ট্রি খামারের মুরগি বিক্রির ভয়েস ডাটা পার্সিং সহকারী। 
ব্যবহারকারী মুরগি বিক্রির সময় খাঁচা (দারি) মেপে মুখে যে বাংলা কথা বলেন, সেখান থেকে ক্রেতার নাম, দারি/খাঁচার নম্বর, মোট কাঁচা ওজন (কেজি ও গ্রাম), মুরগির সংখ্যা (পিস) এবং প্রতি কেজির দর আলাদা করে সঠিক তথ্য তৈরি করুন।

উদাহরণ ১: "নাইম ৩৫ কেজি ২০০ গ্রাম" 
-> buyerName: "নাইম", weightKg: 35.2, grossKg: 35, grossGrams: 200

উদাহরণ ২: "রফিক ২ নম্বর দারি ৪২ কেজি ৫০০ গ্রাম ১৫ পিস দর ১৭০"
-> buyerName: "রফিক", dariNo: 2, weightKg: 42.5, grossKg: 42, grossGrams: 500, birdCount: 15, ratePerKg: 170

উদাহরণ ৩: "৩৮ কেজি ১০০ গ্রাম"
-> buyerName: "${currentBuyer || ''}", weightKg: 38.1, grossKg: 38, grossGrams: 100

যদি কোনো তথ্য বলা না থাকে, তবে যুক্তিসঙ্গত ডিফল্ট ব্যবহার করুন (যেমন ক্রেতা উল্লেখ না থাকলে "${currentBuyer || 'সাধারণ খদ্দের'}")।
বাংলা সংখ্যা (যেমন: পঁয়ত্রিশ, বিয়াল্লিশ, দুইশো, পাঁচশো, সাড়ে সাইত্রিশ) সঠিকভাবে গাণিতিক সংখ্যায় রূপান্তরিত করুন।`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `বাংলা ভয়েস বার্তা: "${transcript}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            buyerName: { type: Type.STRING, description: 'ক্রেতা বা খদ্দেরের নাম' },
            dariNo: { type: Type.INTEGER, description: 'দারি বা খাঁচা নম্বর (যদি থাকে)' },
            weightKg: { type: Type.NUMBER, description: 'মোট কাঁচা ওজন কেজি ও গ্রাম মিলে দশমিক কেজি (যেমন ৩৫.২)' },
            grossKg: { type: Type.INTEGER, description: 'কেজির অংশ' },
            grossGrams: { type: Type.INTEGER, description: 'গ্রামের অংশ (০ থেকে ৯৯৯)' },
            birdCount: { type: Type.INTEGER, description: 'মুরগির সংখ্যা বা পিস (যদি বলা থাকে)' },
            ratePerKg: { type: Type.NUMBER, description: 'প্রতি কেজি বিক্রি দর (যদি বলা থাকে)' },
            confidenceNote: { type: Type.STRING, description: 'সংক্ষিপ্ত ব্যাখ্যা' },
          },
          required: ['weightKg', 'grossKg', 'grossGrams'],
        },
      },
    });

    const parsedText = response.text || '{}';
    const parsedData = JSON.parse(parsedText);

    return res.status(200).json({
      success: true,
      data: {
        buyerName: parsedData.buyerName || currentBuyer || 'সাধারণ খদ্দের',
        dariNo: parsedData.dariNo || null,
        weightKg: Number(parsedData.weightKg) || (Number(parsedData.grossKg || 0) + Number(parsedData.grossGrams || 0) / 1000),
        grossKg: Number(parsedData.grossKg) || 0,
        grossGrams: Number(parsedData.grossGrams) || 0,
        birdCount: Number(parsedData.birdCount) || 0,
        ratePerKg: Number(parsedData.ratePerKg) || defaultRate || 0,
        confidenceNote: parsedData.confidenceNote || 'ভয়েস সফলভাবে বিশ্লেষণ করা হয়েছে',
      },
    });
  } catch (error: any) {
    console.error('Vercel Gemini Voice Parse Error:', error);
    return res.status(500).json({
      success: false,
      error: 'ভয়েস পার্স করতে সমস্যা হয়েছে',
      details: error.message,
    });
  }
}
