'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Vocabulary } from '@/types';

interface AddVocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vocab: Omit<Vocabulary, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialData?: Partial<Vocabulary>;
}

export default function AddVocabularyModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AddVocabularyModalProps) {
  const [germanText, setGermanText] = useState(initialData?.german_text || '');
  const [japaneseText, setJapaneseText] = useState(initialData?.japanese_text || '');
  const [hiraganaReading, setHiraganaReading] = useState(initialData?.romaji || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!germanText.trim() || !japaneseText.trim()) {
      setError('Deutsch und Japanisch müssen ausgefüllt sein');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        german_text: germanText.trim(),
        japanese_text: japaneseText.trim(),
        romaji: hiraganaReading.trim() || undefined,
      });
      
      // Reset form
      setGermanText('');
      setJapaneseText('');
      setHiraganaReading('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Vokabel bearbeiten' : 'Neue Vokabel hinzufügen'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deutsch *
          </label>
          <Input
            value={germanText}
            onChange={(e) => setGermanText(e.target.value)}
            required
            placeholder="Deutsches Wort"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            日本語 *
          </label>
          <Input
            value={japaneseText}
            onChange={(e) => setJapaneseText(e.target.value)}
            required
            placeholder="日本語"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Hiragana-Lesung (optional)
          </label>
          <Input
            value={hiraganaReading}
            onChange={(e) => setHiraganaReading(e.target.value)}
            placeholder="ひらがな (z.B. よい いちにち)"
            disabled={loading}
          />
          <p className="text-xs text-gray-600 mt-1">
            Gib die Hiragana-Lesung für Kanji ein (wird in Klammern unter dem Text angezeigt)
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Speichere...' : initialData ? 'Speichern' : 'Hinzufügen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

