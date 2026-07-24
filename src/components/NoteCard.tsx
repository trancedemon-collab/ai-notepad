import React, { useState } from 'react';
import {
  Pin,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit3,
  Wand2,
  Sparkles,
  Scissors,
  Check,
  MoreVertical,
  Palette,
  FileText,
  RotateCcw,
  Maximize2,
  AlignLeft,
  Clock,
  Calendar,
} from 'lucide-react';
import { Note, AiTriggerType } from '../types';
import { formatDateTime } from '../lib/dateUtils';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onTogglePin: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onAiTransform: (note: Note, action: AiTriggerType) => void;
  onAutoNameNote: (note: Note) => void;
  isTransforming?: boolean;
  transformingNoteId?: string | null;
}

const COLOR_CLASSES: Record<string, { card: string; border: string; header: string; tag: string }> = {
  sky: {
    card: 'bg-stone-900/90 hover:bg-stone-900',
    border: 'border-sky-500/30 hover:border-sky-500/60',
    header: 'bg-sky-500/10 text-sky-300',
    tag: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  emerald: {
    card: 'bg-stone-900/90 hover:bg-stone-900',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    header: 'bg-emerald-500/10 text-emerald-300',
    tag: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  amber: {
    card: 'bg-stone-900/90 hover:bg-stone-900',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    header: 'bg-amber-500/10 text-amber-300',
    tag: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  rose: {
    card: 'bg-stone-900/90 hover:bg-stone-900',
    border: 'border-rose-500/30 hover:border-rose-500/60',
    header: 'bg-rose-500/10 text-rose-300',
    tag: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  violet: {
    card: 'bg-stone-900/90 hover:bg-stone-900',
    border: 'border-violet-500/30 hover:border-violet-500/60',
    header: 'bg-violet-500/10 text-violet-300',
    tag: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  },
  indigo: {
    card: 'bg-stone-900/90 hover:bg-stone-900',
    border: 'border-indigo-500/30 hover:border-indigo-500/60',
    header: 'bg-indigo-500/10 text-indigo-300',
    tag: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  neutral: {
    card: 'bg-stone-900/90 hover:bg-stone-900',
    border: 'border-stone-700 hover:border-stone-500',
    header: 'bg-stone-800 text-stone-300',
    tag: 'bg-stone-800 text-stone-400 border-stone-700',
  },
};

const COLOR_OPTIONS = [
  { name: 'sky', label: 'Sky Blue', bg: 'bg-sky-500' },
  { name: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-500' },
  { name: 'amber', label: 'Warm Amber', bg: 'bg-amber-500' },
  { name: 'rose', label: 'Dusty Rose', bg: 'bg-rose-500' },
  { name: 'violet', label: 'Soft Violet', bg: 'bg-violet-500' },
  { name: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { name: 'neutral', label: 'Neutral Gray', bg: 'bg-stone-600' },
];

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onToggleArchive,
  onTogglePin,
  onChangeColor,
  onAiTransform,
  onAutoNameNote,
  isTransforming,
  transformingNoteId,
}) => {
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const styleConfig = COLOR_CLASSES[note.color || 'neutral'] || COLOR_CLASSES.neutral;

  const wordCount = note.content ? note.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = note.content ? note.content.length : 0;

  const isCurrentLoading = isTransforming && transformingNoteId === note.id;

  return (
    <div
      id={`note-card-${note.id}`}
      className={`group relative flex flex-col rounded-2xl border ${styleConfig.border} ${styleConfig.card} shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5),0_8px_10px_-6px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_35px_-8px_rgba(0,0,0,0.7),0_10px_15px_-5px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all duration-200 overflow-hidden`}
    >
      {/* Top Bar / Title */}
      <div className={`px-4 py-2.5 flex items-center justify-between border-b border-stone-800/80 ${styleConfig.header}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {note.pinned && <Pin className="w-3.5 h-3.5 fill-current text-amber-400 flex-shrink-0" />}
          <h3
            onClick={() => onEdit(note)}
            className="text-sm font-semibold truncate cursor-pointer hover:underline text-stone-100 font-sans tracking-tight"
            title="Click to open plain text notepad editor"
          >
            {note.title || 'Untitled Plain Note'}
          </h3>
        </div>

        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
          {/* Color Picker Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowAiMenu(false);
              }}
              id={`color-picker-btn-${note.id}`}
              className="p-1 rounded-md hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 transition"
              title="Change Accent Color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-stone-900 border border-stone-700 rounded-xl p-2 shadow-xl flex gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      onChangeColor(note.id, c.name);
                      setShowColorPicker(false);
                    }}
                    className={`w-5 h-5 rounded-full ${c.bg} hover:scale-110 transition ${
                      note.color === c.name ? 'ring-2 ring-amber-400' : ''
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pin Button */}
          <button
            onClick={() => onTogglePin(note.id)}
            id={`pin-btn-${note.id}`}
            className={`p-1 rounded-md hover:bg-stone-800/60 transition ${
              note.pinned ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'
            }`}
            title={note.pinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          {/* Expand / Edit Button */}
          <button
            onClick={() => onEdit(note)}
            id={`edit-btn-${note.id}`}
            className="p-1 rounded-md hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 transition"
            title="Open notepad editor"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timestamp sub-header */}
      <div className="px-4 py-1 bg-stone-950/40 border-b border-stone-800/50 flex items-center justify-between text-[11px] text-stone-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-amber-400/80 flex-shrink-0" />
          <span>{formatDateTime(note.createdAt)}</span>
        </div>
      </div>

      {/* Card Content - Plain Text Display */}
      <div
        onClick={() => onEdit(note)}
        className="p-4 flex-1 cursor-pointer font-mono text-xs text-stone-300 leading-relaxed overflow-hidden break-words whitespace-pre-wrap min-h-[100px] max-h-[220px]"
      >
        {note.content ? (
          note.content
        ) : (
          <span className="text-stone-600 italic font-sans">Empty plain text note... Click to start typing.</span>
        )}
      </div>

      {/* Tags line if any */}
      {note.tags && note.tags.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-md font-mono border ${styleConfig.tag}`}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer Toolbar: Quick AI Actions & Management */}
      <div className="px-3 py-2 bg-stone-950/60 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
        <div className="text-[10px] text-stone-500 font-mono flex items-center gap-2">
          <span>{wordCount} w</span>
          <span>•</span>
          <span>{charCount} c</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick AI Trigger Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAiMenu(!showAiMenu);
                setShowColorPicker(false);
              }}
              id={`ai-actions-btn-${note.id}`}
              disabled={isCurrentLoading}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition disabled:opacity-50"
            >
              <Wand2 className="w-3 h-3 text-amber-400" />
              <span>AI Trigger</span>
            </button>

            {showAiMenu && (
              <div className="absolute right-0 bottom-full mb-1 z-30 w-48 bg-stone-900 border border-stone-700 rounded-xl p-1.5 shadow-2xl space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                  Quick AI Enhancements
                </div>
                <button
                  onClick={() => {
                    onAiTransform(note, 'remove_whitespace');
                    setShowAiMenu(false);
                  }}
                  id={`ai-whitespace-btn-${note.id}`}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center gap-2 transition"
                >
                  <Scissors className="w-3.5 h-3.5 text-sky-400" />
                  <span>Remove Whitespace</span>
                </button>
                <button
                  onClick={() => {
                    onAiTransform(note, 'polish');
                    setShowAiMenu(false);
                  }}
                  id={`ai-polish-btn-${note.id}`}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center gap-2 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Polish Text</span>
                </button>
                <button
                  onClick={() => {
                    onAiTransform(note, 'improve');
                    setShowAiMenu(false);
                  }}
                  id={`ai-improve-btn-${note.id}`}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center gap-2 transition"
                >
                  <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Improve Clarity</span>
                </button>
                <button
                  onClick={() => {
                    onAiTransform(note, 'format');
                    setShowAiMenu(false);
                  }}
                  id={`ai-format-btn-${note.id}`}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center gap-2 transition"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-violet-400" />
                  <span>Format Structure</span>
                </button>
                <div className="border-t border-stone-800 my-1" />
                <button
                  onClick={() => {
                    onAutoNameNote(note);
                    setShowAiMenu(false);
                  }}
                  id={`ai-autoname-btn-${note.id}`}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-amber-300 flex items-center gap-2 transition"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-Name Note</span>
                </button>
              </div>
            )}
          </div>

          {/* Archive / Unarchive */}
          <button
            onClick={() => onToggleArchive(note.id)}
            id={`archive-toggle-btn-${note.id}`}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
            title={note.archived ? 'Restore note' : 'Archive note'}
          >
            {note.archived ? <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" /> : <Archive className="w-3.5 h-3.5" />}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(note.id)}
            id={`delete-note-btn-${note.id}`}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition"
            title="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
