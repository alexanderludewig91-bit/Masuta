'use client';

import { Vocabulary, VocabularyCategory } from '@/types';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import JapaneseTextDisplay from '@/components/japanese/JapaneseTextDisplay';

interface VocabularyCardProps {
  vocabulary: Vocabulary;
  categories?: VocabularyCategory[];
  onEdit: (vocab: Vocabulary) => void;
  onDelete: (vocab: Vocabulary) => void;
}

export default function VocabularyCard({
  vocabulary,
  categories = [],
  onEdit,
  onDelete,
}: VocabularyCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-lg font-semibold text-gray-900 mb-1">
            {vocabulary.german_text}
          </div>
          <div className="mb-2">
            <JapaneseTextDisplay
              text={vocabulary.japanese_text}
              size="lg"
              showHiragana={true}
              hiraganaReading={vocabulary.romaji} // Verwende romaji Feld für Hiragana-Lesung
            />
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className="px-2 py-1 text-xs rounded-full"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-600">
            {formatDate(vocabulary.created_at)}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(vocabulary)}
          >
            Bearbeiten
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(vocabulary)}
            className="text-red-600 hover:text-red-700 hover:border-red-300"
          >
            Löschen
          </Button>
        </div>
      </div>
    </div>
  );
}

