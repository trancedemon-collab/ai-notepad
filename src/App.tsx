import React, { useState, useEffect } from 'react';
import { Note, ViewMode, AiTriggerType, GtkTheme } from './types';
import { INITIAL_NOTES } from './lib/initialNotes';
import { Navbar } from './components/Navbar';
import { CanvasView } from './components/CanvasView';
import { GridView } from './components/GridView';
import { PlainEditor } from './components/PlainEditor';
import { AiAgentDrawer } from './components/AiAgentDrawer';
import { CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'ai_canvas_notepad_notes_v1';
const THEME_STORAGE_KEY = 'gtk_theme_setting_v1';

export default function App() {
  // GTK Theme State (gtk-light, gtk-dark, system)
  const [gtkTheme, setGtkTheme] = useState<GtkTheme>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as GtkTheme;
      if (savedTheme === 'gtk-light' || savedTheme === 'gtk-dark' || savedTheme === 'system') {
        return savedTheme;
      }
    } catch (e) {
      console.error('Failed to read theme from localStorage', e);
    }
    return 'system';
  });

  // Apply GTK theme classes to document element & listen to system changes
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, gtkTheme);
    } catch (e) {
      console.error('Failed to save theme to localStorage', e);
    }

    const applyTheme = () => {
      let isDark = true;
      if (gtkTheme === 'gtk-light') {
        isDark = false;
      } else if (gtkTheme === 'gtk-dark') {
        isDark = true;
      } else {
        // System preference
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      document.documentElement.classList.remove('gtk-light', 'gtk-dark');
      if (isDark) {
        document.documentElement.classList.add('gtk-dark');
      } else {
        document.documentElement.classList.add('gtk-light');
      }
    };

    applyTheme();

    if (gtkTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [gtkTheme]);

  // 1. Notes State with localStorage persistence
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load notes from localStorage', e);
    }
    return INITIAL_NOTES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes to localStorage', e);
    }
  }, [notes]);

  // View, Filter & Sorting states
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [filterArchived, setFilterArchived] = useState<'active' | 'archived' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt');

  // Active Editor Modal state
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // AI Assistant Drawer state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' } | null>(null);
  const showToast = (message: string, type: 'info' | 'success' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Transformation loading tracking
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformingNoteId, setTransformingNoteId] = useState<string | null>(null);
  const [isAutoNaming, setIsAutoNaming] = useState(false);

  // Filter notes based on active/archived/search
  const filteredNotes = notes.filter((note) => {
    if (filterArchived === 'active' && note.archived) return false;
    if (filterArchived === 'archived' && !note.archived) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(query);
      const matchContent = note.content.toLowerCase().includes(query);
      const matchTags = (note.tags || []).some((t) => t.toLowerCase().includes(query));
      return matchTitle || matchContent || matchTags;
    }
    return true;
  });

  const activeCount = notes.filter((n) => !n.archived).length;
  const archivedCount = notes.filter((n) => n.archived).length;

  // --------------------------------------------------
  // Note Operations
  // --------------------------------------------------
  const handleCreateNewNote = (initialX = 100, initialY = 100) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Plain Note',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
      pinned: false,
      tags: [],
      x: initialX,
      y: initialY,
      width: 320,
      height: 240,
      color: 'sky',
    };
    setNotes((prev) => [newNote, ...prev]);
    setEditingNote(newNote);
    showToast('Created new plain text note');
  };

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showToast('Deleted note');
  };

  const handleToggleArchive = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const newArchived = !n.archived;
          showToast(newArchived ? 'Note moved to archive' : 'Note restored from archive');
          return { ...n, archived: newArchived, updatedAt: Date.now() };
        }
        return n;
      })
    );
  };

  const handleTogglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const handleChangeColor = (id: string, color: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, color } : n))
    );
  };

  const handleUpdatePosition = (id: string, x: number, y: number) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x, y } : n))
    );
  };

  // --------------------------------------------------
  // AI Operations
  // --------------------------------------------------

  // Inline AI Text Transformation (for Editor or Quick Card triggers)
  const handleAiTransform = async (
    text: string,
    action: AiTriggerType,
    customInstruction?: string
  ): Promise<{ transformedText: string; originalText: string }> => {
    const response = await fetch('/api/ai/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        action,
        customInstruction,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to run AI transformation');
    }

    const data = await response.json();
    return {
      transformedText: data.transformedText,
      originalText: data.originalText,
    };
  };

  // Card Quick AI Action (directly mutates card note text)
  const handleCardAiTransform = async (note: Note, action: AiTriggerType) => {
    setIsTransforming(true);
    setTransformingNoteId(note.id);
    try {
      const res = await handleAiTransform(note.content, action);
      const updatedNote = {
        ...note,
        content: res.transformedText,
        updatedAt: Date.now(),
      };
      handleUpdateNote(updatedNote);
      showToast(`AI applied ${action.replace('_', ' ')} to "${note.title}"`);
    } catch (e) {
      console.error('Card AI trigger error', e);
      showToast('Failed to apply AI transformation', 'info');
    } finally {
      setIsTransforming(false);
      setTransformingNoteId(null);
    }
  };

  // AI Auto-Name All Notes
  const handleAutoNameAll = async () => {
    const targetNotes = notes.filter((n) => !n.archived);
    if (targetNotes.length === 0) return;

    setIsAutoNaming(true);
    try {
      const res = await fetch('/api/ai/auto-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: targetNotes }),
      });

      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        const titleMap = new Map<string, string>();
        data.suggestions.forEach((item: any) => {
          if (item.id && item.suggestedTitle) {
            titleMap.set(item.id, item.suggestedTitle);
          }
        });

        setNotes((prev) =>
          prev.map((n) => {
            if (titleMap.has(n.id)) {
              return { ...n, title: titleMap.get(n.id)!, updatedAt: Date.now() };
            }
            return n;
          })
        );
        showToast(`AI generated descriptive titles for ${titleMap.size} notes!`);
      }
    } catch (e) {
      console.error('Auto name failed', e);
      showToast('Failed to auto-name notes', 'info');
    } finally {
      setIsAutoNaming(false);
    }
  };

  // Single Note Auto-Name
  const handleAutoNameSingle = async (note: Note) => {
    try {
      const res = await fetch('/api/ai/auto-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: [note] }),
      });
      const data = await res.json();
      if (data.suggestions && data.suggestions[0]?.suggestedTitle) {
        const newTitle = data.suggestions[0].suggestedTitle;
        handleUpdateNote({ ...note, title: newTitle, updatedAt: Date.now() });
        showToast(`Renamed note to "${newTitle}"`);
      }
    } catch (e) {
      console.error('Single auto-name error', e);
    }
  };

  // Auto Arrange Canvas Notes into an organized layout with equal spacing
  const handleAutoArrangeCanvas = () => {
    const activeNotes = notes.filter((n) => !n.archived);

    // Sort active notes based on current sortOrder & sortBy
    const sortedActive = [...activeNotes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const valA = a[sortBy] || a.createdAt || 0;
      const valB = b[sortBy] || b.createdAt || 0;
      return sortOrder === 'newest' ? valB - valA : valA - valB;
    });

    const cols = 3;
    const cardWidth = 320;
    const cardHeight = 240;
    const gapX = 40;
    const gapY = 40;
    const startX = 60;
    const startY = 80;

    const updatedNotes = notes.map((n) => {
      if (n.archived) return n;
      const index = sortedActive.findIndex((an) => an.id === n.id);
      if (index === -1) return n;

      const col = index % cols;
      const row = Math.floor(index / cols);

      return {
        ...n,
        width: cardWidth,
        height: cardHeight,
        x: startX + col * (cardWidth + gapX),
        y: startY + row * (cardHeight + gapY),
      };
    });

    setNotes(updatedNotes);
    showToast('Arranged notes neatly with equal spacing & sizes!');
  };

  // Equalize sizes of all notes
  const handleEqualizeSizes = () => {
    setNotes((prev) =>
      prev.map((n) => ({
        ...n,
        width: 320,
        height: 240,
      }))
    );
    showToast('Resized all notes equally (320x240)!');
  };

  // AI Agent Note Creation Callback
  const handleAgentCreateNote = (
    title: string,
    content: string,
    tags?: string[],
    color = 'sky'
  ) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
      pinned: false,
      tags: tags || [],
      x: 100 + (notes.length % 4) * 340,
      y: 100 + Math.floor(notes.length / 4) * 280,
      width: 320,
      height: 240,
      color,
    };
    setNotes((prev) => [newNote, ...prev]);
    showToast(`AI created note: "${title}"`);
  };

  // AI Agent Archive Callback
  const handleAgentArchiveNotes = (ids: string[], archived: boolean) => {
    setNotes((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, archived, updatedAt: Date.now() } : n))
    );
    showToast(`AI updated archive state for ${ids.length} notes`);
  };

  // AI Agent Delete Callback
  const handleAgentDeleteNotes = (ids: string[]) => {
    setNotes((prev) => prev.filter((n) => !ids.includes(n.id)));
    showToast(`AI deleted ${ids.length} notes`);
  };

  return (
    <div className="app-container min-h-screen bg-stone-950 text-stone-100 font-sans flex flex-col selection:bg-amber-500/30 selection:text-amber-200 transition-colors">
      {/* Top Navbar */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        filterArchived={filterArchived}
        setFilterArchived={setFilterArchived}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNewNote={() => handleCreateNewNote(120, 120)}
        onAutoNameAll={handleAutoNameAll}
        onAutoArrange={() => handleAutoArrangeCanvas('grid')}
        toggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        isAiDrawerOpen={isAiDrawerOpen}
        isAutoNaming={isAutoNaming}
        activeCount={activeCount}
        archivedCount={archivedCount}
        gtkTheme={gtkTheme}
        setGtkTheme={setGtkTheme}
      />

      {/* Main View Area */}
      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'canvas' ? (
          <CanvasView
            notes={filteredNotes}
            onEditNote={(n) => setEditingNote(n)}
            onDeleteNote={handleDeleteNote}
            onToggleArchive={handleToggleArchive}
            onTogglePin={handleTogglePin}
            onChangeColor={handleChangeColor}
            onAiTransform={handleCardAiTransform}
            onAutoNameNote={handleAutoNameSingle}
            onUpdatePosition={handleUpdatePosition}
            onNewNoteAtPosition={(x, y) => handleCreateNewNote(x, y)}
            onAutoArrange={handleAutoArrangeCanvas}
            onEqualizeSizes={handleEqualizeSizes}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            isTransforming={isTransforming}
            transformingNoteId={transformingNoteId}
          />
        ) : (
          <GridView
            notes={filteredNotes}
            onEditNote={(n) => setEditingNote(n)}
            onDeleteNote={handleDeleteNote}
            onToggleArchive={handleToggleArchive}
            onTogglePin={handleTogglePin}
            onChangeColor={handleChangeColor}
            onAiTransform={handleCardAiTransform}
            onAutoNameNote={handleAutoNameSingle}
            onNewNote={() => handleCreateNewNote(120, 120)}
            searchQuery={searchQuery}
            filterArchived={filterArchived}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            sortBy={sortBy}
            setSortBy={setSortBy}
            isTransforming={isTransforming}
            transformingNoteId={transformingNoteId}
          />
        )}
      </main>

      {/* Active Plain Text Editor Modal */}
      {editingNote && (
        <PlainEditor
          note={editingNote}
          onSave={handleUpdateNote}
          onClose={() => setEditingNote(null)}
          onAiTransform={handleAiTransform}
        />
      )}

      {/* AI Assistant Chat Drawer */}
      <AiAgentDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        notes={notes}
        onAutoNameAll={handleAutoNameAll}
        onCreateNote={handleAgentCreateNote}
        onUpdateNote={(id, updates) =>
          setNotes((prev) =>
            prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n))
          )
        }
        onArchiveNotes={handleAgentArchiveNotes}
        onDeleteNotes={handleAgentDeleteNotes}
        onArrangeNotes={handleAutoArrangeCanvas}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900 border border-amber-500/40 text-amber-200 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
