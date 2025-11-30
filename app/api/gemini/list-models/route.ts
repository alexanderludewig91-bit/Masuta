import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY nicht gesetzt' },
        { status: 500 }
      );
    }

    // Rufe die ListModels API direkt auf
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          error: 'Fehler beim Abrufen der Modelle',
          status: response.status,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Filtere nur Modelle, die generateContent unterstützen
    const availableModels = (data.models || [])
      .filter((model: any) => 
        model.supportedGenerationMethods?.includes('generateContent')
      )
      .map((model: any) => ({
        name: model.name,
        displayName: model.displayName,
        supportedMethods: model.supportedGenerationMethods,
      }));

    return NextResponse.json({
      total: data.models?.length || 0,
      available: availableModels.length,
      models: availableModels,
      allModels: data.models?.map((m: any) => m.name) || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Fehler beim Abrufen der Modelle' },
      { status: 500 }
    );
  }
}

