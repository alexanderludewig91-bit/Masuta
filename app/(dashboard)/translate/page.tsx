'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { Vocabulary } from '@/types';
import JapaneseTextDisplay from '@/components/japanese/JapaneseTextDisplay';

interface TranslationResult {
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

export default function TranslatePage() {
  const [sourceText, setSourceText] = useState('');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError('Bitte gib einen Text ein');
      return;
    }

    setLoading(true);
    setError(null);
    setTranslationResult(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          sourceLanguage: 'de',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Übersetzung fehlgeschlagen');
      }

      const data = await response.json();
      setTranslationResult(data);
    } catch (err: any) {
      setError(err.message || 'Übersetzung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToVocabulary = async () => {
    if (!sourceText.trim() || !translationResult) {
      setError('Übersetzung fehlt');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      const { error } = await supabase
        .from('vocabularies')
        .insert({
          user_id: user.id,
          german_text: sourceText,
          japanese_text: translationResult.kanji,
          romaji: translationResult.hiragana, // Speichere Hiragana im romaji Feld
        });

      if (error) throw error;

      setShowAddModal(false);
      setSourceText('');
      setTranslationResult(null);
      
      alert('Vokabel zur Liste hinzugefügt!');
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Übersetzen</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Deutsch
          </label>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Deutscher Text..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
            disabled={loading}
          />
        </div>

        <Button
          onClick={handleTranslate}
          disabled={loading || !sourceText.trim()}
          className="w-full"
        >
          {loading ? 'Übersetze...' : 'Übersetzen'}
        </Button>

        {translationResult && (
          <>
            <div className="border-t pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  日本語
                </label>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="text-2xl font-medium">
                    {translationResult.kanji}
                  </div>
                  {translationResult.hiragana && (
                    <div className="text-lg text-gray-700 italic">
                      ({translationResult.hiragana})
                    </div>
                  )}
                  {translationResult.romaji && (
                    <div className="text-sm text-gray-600">
                      [{translationResult.romaji}]
                    </div>
                  )}
                </div>
              </div>

              {translationResult.examples && translationResult.examples.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-3">
                    Beispielsätze
                  </label>
                  <div className="space-y-4">
                    {translationResult.examples.map((example, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <div className="flex-1 space-y-2">
                            <div>
                              <div className="text-lg font-medium mb-1">
                                {example.japanese}
                              </div>
                              <div className="text-sm text-gray-700 italic">
                                ({example.hiragana})
                              </div>
                            </div>
                            <div className="text-gray-800 font-medium">
                              {example.german}
                            </div>
                            <div className="text-sm text-gray-700 bg-white rounded p-2 border border-gray-200">
                              💡 {example.explanation}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => setShowAddModal(true)}
                variant="secondary"
                className="w-full"
              >
                Zur Vokabelliste hinzufügen
              </Button>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Zur Vokabelliste hinzufügen"
      >
        <div className="space-y-4">
          <p className="text-gray-800">
            Möchtest du diese Übersetzung zu deiner Vokabelliste hinzufügen?
          </p>
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-800">Deutsch: </span>
              <span className="text-gray-900">{sourceText}</span>
            </div>
            {translationResult && (
              <div>
                <span className="text-sm font-medium text-gray-800">日本語: </span>
                <span className="text-gray-900">{translationResult.kanji}</span>
                {translationResult.hiragana && (
                  <span className="text-gray-600 italic ml-2">
                    ({translationResult.hiragana})
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAddToVocabulary} disabled={saving}>
              {saving ? 'Speichere...' : 'Hinzufügen'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
