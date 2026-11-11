import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK with server-side API Key
const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Endpoint 1: Smart Bengali Voice Text Parser
app.post('/api/parse-voice', async (req, res) => {
  try {
    const { transcript, currentBuyer, defaultTareKg, defaultRate } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'ভয়েস টেক্সট প্রয়োজন' });
    }

    const ai = getAi();
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

    return res.json({
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
    console.error('Gemini Voice Parse Error:', error);
    return res.status(500).json({
      success: false,
      error: 'ভয়েস পার্স করতে সমস্যা হয়েছে',
      details: error.message,
    });
  }
});

// API Endpoint 2: AI Farm & Sales Insights Helper
app.post('/api/ai-insights', async (req, res) => {
  try {
    const { batchSummary, question } = req.body;
    const ai = getAi();

    const prompt = `আপনি বাংলাদেশের একজন অভিজ্ঞ পোল্ট্রি বিশেষজ্ঞ ও খামার হিসাব পরামর্শক।
খামারির বর্তমান বিক্রি হিসাব:
- মোট দারি count: ${batchSummary?.totalDari || 0} টি
- মোট কাঁচা ওজন: ${batchSummary?.totalGrossKg || 0} কেজি
- মোট নিট মুরগির ওজন: ${batchSummary?.totalNetKg || 0} কেজি
- মোট বিক্রিত মুরগি: ${batchSummary?.totalBirds || 0} পিস
- গড়ে প্রতি মুরগির ওজন: ${batchSummary?.avgBirdWeight || 0} কেজি
- মোট বিক্রির টাকা: ৳${batchSummary?.totalAmount || 0}

প্রশ্ন/অনুরোধ: ${question || 'এই বিক্রির সারসংক্ষেপ ও খামারির জন্য দরকারী পরামর্শ দিন।'}

দয়া করে সহজে বাংলা ভাষায় ২-৩ টি সংক্ষিপ্ত বুলেট পয়েন্টে বাস্তবসম্মত পরামর্শ ও পর্যবেক্ষণ পেশ করুন।`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      success: true,
      insight: response.text,
    });
  } catch (error: any) {
    console.error('AI Insights error:', error);
    return res.json({
      success: false,
      insight: 'বিজ্ঞ এআই পরামর্শ তৈরি করতে সাময়িক সমস্যা হয়েছে।',
    });
  }
});

// Start Dev Server with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(url, `<!doctype html><html><head></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`);
        const fs = await import('fs');
        template = fs.readFileSync('index.html', 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
