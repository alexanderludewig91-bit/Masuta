import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Cache für verfügbare Modelle (1 Stunde)
let cachedModels: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 Stunde

/**
 * Ruft die verfügbaren Modelle über die Gemini API ab (mit Caching)
 */
async function getAvailableModels(): Promise<string[]> {
  // Prüfe Cache
  const now = Date.now();
  if (cachedModels && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedModels;
  }
  try {
    // Versuche zuerst v1beta, dann v1
    const apiVersions = ['v1beta', 'v1'];
    
    for (const version of apiVersions) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`
        );
        
        if (!response.ok) {
          continue; // Versuche nächste Version
        }
        
        const data = await response.json();
        const models = data.models || [];
        
        // Filtere nur Modelle, die generateContent unterstützen
        const availableModels = models
          .filter((model: any) => 
            model.supportedGenerationMethods?.includes('generateContent') &&
            model.name.startsWith('models/gemini')
          )
          .map((model: any) => model.name); // Behalte das "models/" Präfix
        
        if (availableModels.length > 0) {
          // Priorisiere bestimmte Modelle
          const priorityModels = [
            'models/gemini-2.5-flash',
            'models/gemini-2.5-pro',
            'models/gemini-2.0-flash',
            'models/gemini-flash-latest',
            'models/gemini-pro-latest',
          ];
          
          // Sortiere: Prioritätsmodelle zuerst
          const sorted = [
            ...availableModels.filter(m => priorityModels.includes(m)),
            ...availableModels.filter(m => !priorityModels.includes(m)),
          ];
          
          // Cache speichern
          cachedModels = sorted;
          cacheTimestamp = now;
          
          // Cache speichern
          cachedModels = sorted;
          cacheTimestamp = Date.now();
          
          // Kein Logging mehr - spart Performance
          return sorted;
        }
      } catch (error) {
        console.warn(`Fehler mit API Version ${version}:`, error);
        continue;
      }
    }
    
    console.warn('Konnte keine Modelle abrufen, verwende Fallback');
    return ['models/gemini-flash-latest', 'models/gemini-pro-latest']; // Fallback
  } catch (error) {
    console.error('Fehler beim Abrufen der Modelle:', error);
    return ['models/gemini-flash-latest', 'models/gemini-pro-latest']; // Fallback
  }
}

export interface TranslationResult {
  kanji: string;
  hiragana: string;
  romaji?: string;
  examples: Array<{
    japanese: string;
    hiragana: string;
    german: string;
    explanation: string;
  }>;
}

export async function translateWithGemini(
  text: string,
  sourceLanguage: 'de' | 'ja'
): Promise<TranslationResult> {
  const targetLanguage = sourceLanguage === 'de' ? 'ja' : 'de';
  
  // Verwende direkt das schnellste Modell (gemini-2.5-flash)
  // Starte direkt ohne Modellliste abzurufen - das spart Zeit
  const preferredModel = 'gemini-2.5-flash';
  const fallbackModels = ['gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-flash-latest'];
  
  // Versuche zuerst das bevorzugte Modell direkt
  const modelNames = [preferredModel, ...fallbackModels];
  
  // Detaillierter Prompt für bessere Qualität
  const prompt = sourceLanguage === 'de' 
    ? `Du bist ein Experte für die japanische Sprache und hilfst Menschen beim Lernen.

Übersetze den folgenden deutschen Text ins Japanische und gib eine detaillierte Antwort im JSON-Format:

Text: "${text}"

Antworte NUR mit einem JSON-Objekt im folgenden Format (keine zusätzlichen Erklärungen, nur das JSON):
{
  "kanji": "Die Übersetzung in Kanji (falls angebracht)",
  "hiragana": "Die vollständige Hiragana-Lesung des gesamten Textes",
  "romaji": "Die Romaji-Aussprache (optional)",
  "examples": [
    {
      "japanese": "Ein Beispielsatz auf Japanisch mit Kanji",
      "hiragana": "Die Hiragana-Lesung des Beispielsatzes",
      "german": "Die deutsche Übersetzung des Beispielsatzes",
      "explanation": "Eine kurze Erklärung auf Deutsch, wie dieser Satz verwendet wird und was wichtig ist (Grammatik, Höflichkeit, Kontext, etc.)"
    },
    {
      "japanese": "Ein zweiter Beispielsatz auf Japanisch mit Kanji",
      "hiragana": "Die Hiragana-Lesung des zweiten Beispielsatzes",
      "german": "Die deutsche Übersetzung des zweiten Beispielsatzes",
      "explanation": "Eine kurze Erklärung auf Deutsch für den zweiten Satz"
    }
  ]
}

Wichtig:
- Die "hiragana" sollte die vollständige Lesung sein, nicht nur einzelne Zeichen
- Die Beispielsätze sollten natürliche, alltägliche japanische Sätze sein, die den Begriff verwenden
- Die Erklärungen sollten für Deutschsprachige hilfreich sein, die Japanisch lernen`
    : `Du bist ein Experte für die deutsche Sprache und hilfst Menschen beim Lernen.

Übersetze den folgenden japanischen Text ins Deutsche und gib eine detaillierte Antwort im JSON-Format:

Text: "${text}"

Antworte NUR mit einem JSON-Objekt im folgenden Format (keine zusätzlichen Erklärungen, nur das JSON):
{
  "kanji": "Der Originaltext (falls Kanji vorhanden)",
  "hiragana": "Die Hiragana-Lesung des japanischen Textes",
  "romaji": "Die Romaji-Aussprache (optional)",
  "examples": [
    {
      "japanese": "Ein Beispielsatz auf Japanisch mit dem Begriff",
      "hiragana": "Die Hiragana-Lesung des Beispielsatzes",
      "german": "Die deutsche Übersetzung des Beispielsatzes",
      "explanation": "Eine kurze Erklärung auf Deutsch, wie dieser Satz verwendet wird und was wichtig ist"
    },
    {
      "japanese": "Ein zweiter Beispielsatz auf Japanisch",
      "hiragana": "Die Hiragana-Lesung des zweiten Beispielsatzes",
      "german": "Die deutsche Übersetzung des zweiten Beispielsatzes",
      "explanation": "Eine kurze Erklärung auf Deutsch für den zweiten Satz"
    }
  ]
}`;

  // Versuche jedes Modell, bis eines funktioniert
  let lastError: Error | null = null;
  
  for (const modelName of modelNames) {
    try {
      // Versuche zuerst das SDK
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.3, // Niedrige Temperatur für konsistentere JSON-Ausgaben
          topP: 0.8,
          topK: 40,
        },
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Extrahiere JSON aus der Antwort (kann Markdown-Code-Blöcke enthalten)
      let jsonText = responseText.trim();
      
      // Entferne Markdown-Code-Blöcke falls vorhanden
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Versuche JSON zu parsen, mit besserer Fehlerbehandlung
      let parsed;
      try {
        parsed = JSON.parse(jsonText.trim());
      } catch (parseError: any) {
        // Versuche, ungültiges JSON zu reparieren (z.B. fehlende Kommas, etc.)
        console.warn('JSON-Parsing-Fehler, versuche Reparatur...', parseError.message);
        
        // Versuche, häufige JSON-Fehler zu beheben
        let fixedJson = jsonText
          .replace(/,(\s*[}\]])/g, '$1') // Entferne trailing commas
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Füge fehlende Anführungszeichen hinzu
          .replace(/:\s*([^",\[\]{}]+)([,}\]])/g, ': "$1"$2'); // Füge Anführungszeichen um Werte hinzu
        
        try {
          parsed = JSON.parse(fixedJson);
        } catch (e) {
          // Wenn Reparatur fehlschlägt, versuche nächstes Modell
          throw new Error(`JSON-Parsing fehlgeschlagen: ${parseError.message}. Antwort: ${jsonText.substring(0, 200)}...`);
        }
      }
      
      return {
        kanji: parsed.kanji || responseText,
        hiragana: parsed.hiragana || '',
        romaji: parsed.romaji,
        examples: parsed.examples || [],
      };
    } catch (error: any) {
      lastError = error;
      
      // Prüfe ob es ein Modell-Problem ist (404 = Modell nicht gefunden)
      if (error?.status === 404 || error?.message?.includes('not found')) {
        console.log(`Modell ${modelName} nicht verfügbar über SDK, versuche REST API...`);
        
        // Versuche REST API direkt als Fallback
        try {
          // Entferne "models/" Präfix für REST API falls vorhanden
          const apiModelName = modelName.replace(/^models\//, '');
          const restResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${apiModelName}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: prompt }]
                }]
              }),
            }
          );
          
          if (restResponse.ok) {
            const restData = await restResponse.json();
            const responseText = restData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            if (responseText) {
              // Extrahiere JSON aus der Antwort
              let jsonText = responseText.trim();
              if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
              } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
              }
              
              const parsed = JSON.parse(jsonText.trim());
              
              return {
                kanji: parsed.kanji || responseText,
                hiragana: parsed.hiragana || '',
                romaji: parsed.romaji,
                examples: parsed.examples || [],
              };
            }
          }
        } catch (restError) {
          console.log(`REST API für ${modelName} auch fehlgeschlagen`);
        }
        
        continue; // Versuche nächstes Modell
      }
      
      // Bei anderen Fehlern (z.B. JSON-Parsing), versuche auch nächstes Modell
      console.error(`Fehler mit Modell ${modelName}:`, error.message);
      continue;
    }
  }
  
  // Wenn alle Modelle fehlgeschlagen sind
  throw new Error(
    `Keines der verfügbaren Gemini-Modelle funktioniert. ` +
    `Bitte prüfe deinen API-Key und die verfügbaren Modelle. ` +
    `Öffne http://localhost:3000/api/gemini/list-models um verfügbare Modelle zu sehen. ` +
    `Letzter Fehler: ${lastError?.message || 'Unbekannt'}`
  );
}

