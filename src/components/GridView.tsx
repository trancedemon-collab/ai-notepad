import React from 'react';
import { Note, AiTriggerType } from '../types';
import { NoteCard } from './NoteCard';
import { FileText, Plus, SearchX, Archive, Clock, ArrowUp, ArrowDown } from 'lucide-react';

interface GridViewProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onTogglePin: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onAiTransform: (note: Note, action: AiTriggerType) => void;
  onAutoNameNote: (note: Note) => void;
  onNewNote: () => void;
  searchQuery: string;
  filterArchived: 'active' | 'archived' | 'all';
  sortOrder?: 'newest' | 'oldest';
  setSortOrder?: (order: 'newest' | 'oldest') => void;
  sortBy?: 'createdAt' | 'updatedAt';
  setSortBy?: (by: 'createdAt' | 'updatedAt') => void;
  isTransforming?: boolean;
  transformingNoteId?: string | null;
}

export const GridView: React.FC<GridViewProps> = ({
  notes,
  onEditNote,
  onDeleteNote,
  onToggleArchive,
  onTogglePin,
  onChangeColor,
  onAiTransform,
  onAutoNameNote,
  onNewNote,
  searchQuery,
  filterArchived,
  sortOrder = 'newest',
  setSortOrder,
  sortBy = 'createdAt',
  setSortBy,
  isTransforming,
  transformingNoteId,
}) => {
  // Sort pinned notes to top, then by selected date/time field & order
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    const valA = a[sortBy] || a.createdAt || 0;
    const valB = b[sortBy] || b.createdAt || 0;

    return sortOrder === 'newest' ? valB - valA : valA - valB;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 min-h-[calc(100vh-65px)]">
      {/* Grid Sub-header with Sort & Count Controls */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2 text-xs text-stone-400">
        <div className="font-mono flex items-center gap-2">
          <span className="text-stone-300 font-semibold">{sortedNotes.length} Notes</span>
          {filterArchived === 'archived' && (
            <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-400">Archived</span>
          )}
        </div>

        {setSortOrder && (
          <div className="flex items-center gap-2">
            {setSortBy && (
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-1 flex items-center text-[11px] font-mono">
                <button
                  onClick={() => setSortBy('createdAt')}
                  id="sort-by-created-btn"
                  className={`px-2 py-1 rounded-lg transition ${
                    sortBy === 'createdAt' ? 'bg-stone-800 text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Date Created
                </button>
                <button
                  onClick={() => setSortBy('updatedAt')}
                  id="sort-by-updated-btn"
                  className={`px-2 py-1 rounded-lg transition ${
                    sortBy === 'updatedAt' ? 'bg-stone-800 text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Last Modified
                </button>
              </div>
            )}

            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              id="grid-toggle-sort-order-btn"
              className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/30 text-amber-300 flex items-center gap-1.5 transition font-medium text-xs cursor-pointer shadow-sm"
              title={
                sortOrder === 'newest'
                  ? 'Showing latest notes on top (Click for oldest on top)'
                  : 'Showing oldest notes on top (Click for latest on top)'
              }
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-[11px]">
                {sortOrder === 'newest' ? 'Latest On Top' : 'Oldest On Top'}
              </span>
              {sortOrder === 'newest' ? (
                <ArrowUp className="w-3 h-3 text-amber-400" />
              ) : (
                <ArrowDown className="w-3 h-3 text-amber-400" />
              )}
            </button>
          </div>
        )}
      </div>

      {sortedNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500 mb-4 shadow-inner">
            {searchQuery ? <SearchX className="w-8 h-8" /> : filterArchived === 'archived' ? <Archive className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
          </div>
          <h3 className="text-base font-bold text-stone-200 font-mono">
            {searchQuery
              ? `No notes matching "${searchQuery}"`
              : filterArchived === 'archived'
              ? 'No Archived Notes'
              : 'No Plain Text Notes Yet'}
          </h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mb-6">
            {searchQuery
              ? 'Try adjusting your search query or clear filters to see all notes.'
              : filterArchived === 'archived'
              ? 'Notes you archive will show up here for safekeeping.'
              : 'Create your first plain text note or chat with your AI assistant to generate notes.'}
          </p>

          {!searchQuery && filterArchived !== 'archived' && (
            <button
              onClick={onNewNote}
              id="grid-empty-new-note-btn"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition shadow-lg shadow-amber-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Note</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={onEditNote}
              onDelete={onDeleteNote}
              onToggleArchive={onToggleArchive}
              onTogglePin={onTogglePin}
              onChangeColor={onChangeColor}
              onAiTransform={onAiTransform}
              onAutoNameNote={onAutoNameNote}
              isTransforming={isTransforming}
              transformingNoteId={transformingNoteId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
