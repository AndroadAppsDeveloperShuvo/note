import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { batchSummary, question } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const ai = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `আপনি বাংলাদেশের একজন অভিজ্ঞ পোল্ট্রি বিশেষজ্ঞ ও খামার হিসাব পরামর্শক।
খামারির বর্তমান বিক্রি হিসাব:
- মোট Dari count: ${batchSummary?.totalDari || 0} টি
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

    return res.status(200).json({
      success: true,
      insight: response.text,
    });
  } catch (error: any) {
    console.error('Vercel AI Insights error:', error);
    return res.status(200).json({
      success: false,
      insight: 'বিজ্ঞ এআই পরামর্শ তৈরি করতে সাময়িক সমস্যা হয়েছে।',
    });
  }
}
