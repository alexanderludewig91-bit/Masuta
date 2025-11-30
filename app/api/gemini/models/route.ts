import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY nicht gesetzt' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Versuche verschiedene Modellnamen zu testen
    const modelNames = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-pro-vision',
    ];
    
    const results: Array<{ name: string; available: boolean; error?: string }> = [];
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Versuche einen sehr kurzen Test-Call
        const result = await model.generateContent('test');
        await result.response;
        results.push({ name: modelName, available: true });
      } catch (error: any) {
        results.push({
          name: modelName,
          available: false,
          error: error.message || 'Unbekannter Fehler',
        });
      }
    }
    
    return NextResponse.json({ models: results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Fehler beim Abrufen der Modelle' },
      { status: 500 }
    );
  }
}

