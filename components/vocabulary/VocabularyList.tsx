'use client';

import { Vocabulary, VocabularyCategory } from '@/types';
import VocabularyCard from './VocabularyCard';

interface VocabularyListProps {
  vocabularies: Vocabulary[];
  categories: VocabularyCategory[];
  onEdit: (vocab: Vocabulary) => void;
  onDelete: (vocab: Vocabulary) => void;
}

export default function VocabularyList({
  vocabularies,
  categories,
  onEdit,
  onDelete,
}: VocabularyListProps) {
  if (vocabularies.length === 0) {
    return (
      <div className="text-center py-12 text-gray-700">
        <p className="text-lg mb-2">Noch keine Vokabeln</p>
        <p className="text-sm">Füge deine erste Vokabel über die Übersetzungsseite hinzu!</p>
      </div>
    );
  }

  const getCategoriesForVocabulary = (vocabId: string): VocabularyCategory[] => {
    // Diese Funktion sollte die Kategorien für eine Vokabel zurückgeben
    // Für jetzt geben wir eine leere Liste zurück, da die Relation noch nicht implementiert ist
    return [];
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vocabularies.map((vocab) => (
        <VocabularyCard
          key={vocab.id}
          vocabulary={vocab}
          categories={getCategoriesForVocabulary(vocab.id)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

