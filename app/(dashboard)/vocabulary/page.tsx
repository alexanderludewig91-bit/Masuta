'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Vocabulary } from '@/types';
import VocabularyList from '@/components/vocabulary/VocabularyList';
import AddVocabularyModal from '@/components/vocabulary/AddVocabularyModal';
import { ConfirmModal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function VocabularyPage() {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);
  const [deletingVocab, setDeletingVocab] = useState<Vocabulary | null>(null);

  useEffect(() => {
    loadVocabularies();
  }, []);

  const loadVocabularies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vocabularies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVocabularies(data || []);
    } catch (error) {
      console.error('Error loading vocabularies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (vocabData: Omit<Vocabulary, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Nicht angemeldet');

    if (editingVocab) {
      // Update
      const { error } = await supabase
        .from('vocabularies')
        .update({
          german_text: vocabData.german_text,
          japanese_text: vocabData.japanese_text,
          romaji: vocabData.romaji,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingVocab.id);

      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabase
        .from('vocabularies')
        .insert({
          user_id: user.id,
          ...vocabData,
        });

      if (error) throw error;
    }

    await loadVocabularies();
    setEditingVocab(null);
  };

  const handleDelete = async () => {
    if (!deletingVocab) return;

    try {
      // Lösche auch zugehörige Learning Stats
      await supabase
        .from('learning_stats')
        .delete()
        .eq('vocabulary_id', deletingVocab.id);

      const { error } = await supabase
        .from('vocabularies')
        .delete()
        .eq('id', deletingVocab.id);

      if (error) throw error;

      await loadVocabularies();
      setDeletingVocab(null);
    } catch (error) {
      console.error('Error deleting vocabulary:', error);
      alert('Fehler beim Löschen');
    }
  };

  const filteredVocabularies = vocabularies.filter(
    (vocab) =>
      vocab.german_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vocab.japanese_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vocab.romaji?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-700">
        <p>Lädt Vokabeln...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Vokabelliste</h1>
        <Button onClick={() => setShowAddModal(true)}>
          + Neue Vokabel
        </Button>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Vokabeln durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="mb-4 text-sm text-gray-800">
        {filteredVocabularies.length} von {vocabularies.length} Vokabeln
      </div>

      <VocabularyList
        vocabularies={filteredVocabularies}
        categories={[]}
        onEdit={(vocab) => {
          setEditingVocab(vocab);
          setShowAddModal(true);
        }}
        onDelete={(vocab) => setDeletingVocab(vocab)}
      />

      <AddVocabularyModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingVocab(null);
        }}
        onSave={handleSave}
        initialData={editingVocab || undefined}
      />

      <ConfirmModal
        isOpen={!!deletingVocab}
        onClose={() => setDeletingVocab(null)}
        onConfirm={handleDelete}
        title="Vokabel löschen"
        message={`Möchtest du "${deletingVocab?.german_text}" wirklich löschen?`}
        confirmText="Löschen"
        cancelText="Abbrechen"
        variant="danger"
      />
    </div>
  );
}

