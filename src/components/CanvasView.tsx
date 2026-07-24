import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Plus,
  LayoutGrid,
  Move,
  MousePointer,
  Sparkles,
  Scaling,
  ArrowUpDown,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Note, AiTriggerType } from '../types';
import { NoteCard } from './NoteCard';

interface CanvasViewProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onTogglePin: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onAiTransform: (note: Note, action: AiTriggerType) => void;
  onAutoNameNote: (note: Note) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onNewNoteAtPosition?: (x: number, y: number) => void;
  onAutoArrange?: () => void;
  onEqualizeSizes?: () => void;
  sortOrder?: 'newest' | 'oldest';
  setSortOrder?: (order: 'newest' | 'oldest') => void;
  isTransforming?: boolean;
  transformingNoteId?: string | null;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  notes,
  onEditNote,
  onDeleteNote,
  onToggleArchive,
  onTogglePin,
  onChangeColor,
  onAiTransform,
  onAutoNameNote,
  onUpdatePosition,
  onNewNoteAtPosition,
  onAutoArrange,
  onEqualizeSizes,
  sortOrder = 'newest',
  setSortOrder,
  isTransforming,
  transformingNoteId,
}) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Dragging a note
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Strictly prevent drag from opening note
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle canvas pan with middle click or space key / background drag
  const handleMouseDown = (e: React.MouseEvent) => {
    // If target is background or canvas grid
    if (
      e.target === canvasRef.current ||
      (e.target as HTMLElement).classList.contains('canvas-background')
    ) {
      if (e.button === 0 || e.button === 1) {
        setIsPanning(true);
        setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    } else if (draggingNoteId) {
      if (dragStartPosRef.current) {
        const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
        const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
        if (dx > 4 || dy > 4) {
          hasMovedRef.current = true;
        }
      }
      const newX = Math.max(20, Math.round((e.clientX - pan.x - dragOffset.x) / scale));
      const newY = Math.max(20, Math.round((e.clientY - pan.y - dragOffset.y) / scale));
      onUpdatePosition(draggingNoteId, newX, newY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNoteId(null);
    dragStartPosRef.current = null;
    // Reset hasMovedRef after a slight delay to block click events triggered by mouseup
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 100);
  };

  // Start dragging a specific note card
  const handleNoteMouseDown = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    // Don't drag if clicking input, button, or textarea
    const targetEl = e.target as HTMLElement;
    if (
      targetEl.tagName === 'BUTTON' ||
      targetEl.tagName === 'INPUT' ||
      targetEl.tagName === 'TEXTAREA' ||
      targetEl.closest('button')
    ) {
      return;
    }

    setDraggingNoteId(note.id);
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;

    const clientX = e.clientX;
    const clientY = e.clientY;
    setDragOffset({
      x: clientX - (note.x * scale + pan.x),
      y: clientY - (note.y * scale + pan.y),
    });
  };

  // Safe wrapper for opening note that suppresses open when dragging occurred
  const handleCardEditSafe = (note: Note) => {
    if (hasMovedRef.current) {
      // Suppress opening note when dragging
      return;
    }
    onEditNote(note);
  };

  // Zoom controls
  const handleZoomIn = () => setScale((prev) => Math.min(2, prev + 0.15));
  const handleZoomOut = () => setScale((prev) => Math.max(0.5, prev - 0.15));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Double click canvas to create note
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (
      e.target === canvasRef.current ||
      (e.target as HTMLElement).classList.contains('canvas-background')
    ) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = Math.round((e.clientX - rect.left - pan.x) / scale);
        const y = Math.round((e.clientY - rect.top - pan.y) / scale);
        if (onNewNoteAtPosition) {
          onNewNoteAtPosition(x, y);
        }
      }
    }
  };

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      id="infinite-canvas-board"
      className={`relative w-full h-[calc(100vh-65px)] overflow-hidden select-none bg-stone-950 canvas-background ${
        isPanning ? 'cursor-grabbing' : 'cursor-default'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
        backgroundSize: `${32 * scale}px ${32 * scale}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Canvas Toolbar Floating Controls */}
      <div className="absolute top-4 left-4 z-20 bg-stone-900/90 border border-stone-800 backdrop-blur-md rounded-2xl p-1.5 shadow-2xl flex items-center gap-1.5 text-xs text-stone-300 flex-wrap max-w-[95vw]">
        <button
          onClick={handleZoomIn}
          id="canvas-zoom-in-btn"
          className="p-1.5 rounded-xl hover:bg-stone-800 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          id="canvas-zoom-out-btn"
          className="p-1.5 rounded-xl hover:bg-stone-800 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="px-1.5 font-mono text-[11px] text-amber-400 font-bold min-w-[42px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleResetZoom}
          id="canvas-reset-view-btn"
          className="p-1.5 rounded-xl hover:bg-stone-800 transition text-stone-400 hover:text-stone-200"
          title="Reset Zoom & Pan"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-stone-800 mx-0.5" />

        {/* Auto Arrange Neat Grid */}
        {onAutoArrange && (
          <button
            onClick={onAutoArrange}
            id="canvas-arrange-grid-btn"
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1.5 transition font-medium text-xs"
            title="Arrange notes neatly along canvas horizontally & vertically with equal spacing"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Arrange Grid</span>
          </button>
        )}

        {/* Equalize Sizes Button */}
        {onEqualizeSizes && (
          <button
            onClick={onEqualizeSizes}
            id="canvas-equalize-sizes-btn"
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1.5 transition font-medium text-xs"
            title="Resize all notes equally to 320x240 standard size"
          >
            <Scaling className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Equalize Sizes</span>
          </button>
        )}

        {/* Sort by Date/Time order toggle */}
        {setSortOrder && (
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            id="canvas-toggle-sort-order-btn"
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition font-medium text-xs cursor-pointer"
            title={
              sortOrder === 'newest'
                ? 'Sorted by Time/Date: Latest notes on top (Click for Oldest on top)'
                : 'Sorted by Time/Date: Oldest notes on top (Click for Latest on top)'
            }
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px]">
              {sortOrder === 'newest' ? 'Latest First' : 'Oldest First'}
            </span>
            {sortOrder === 'newest' ? (
              <ArrowUp className="w-3 h-3 text-amber-400" />
            ) : (
              <ArrowDown className="w-3 h-3 text-amber-400" />
            )}
          </button>
        )}

        <div className="w-[1px] h-4 bg-stone-800 mx-0.5 hidden md:block" />
        <span className="text-[10px] text-stone-500 font-mono hidden md:inline px-1">
          Drag background to pan • Double-click to add note
        </span>
      </div>

      {/* Render Note Cards transformed on canvas */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {notes.length === 0 ? (
          <div className="absolute top-40 left-1/2 -translate-x-1/2 text-center pointer-events-auto p-6 bg-stone-900/80 border border-stone-800 rounded-2xl max-w-sm">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-stone-200 font-mono">Empty Canvas</h3>
            <p className="text-xs text-stone-400 mt-1 mb-3">
              Double click anywhere or click 'New Note' to add plain text notes to your canvas.
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              onMouseDown={(e) => handleNoteMouseDown(e, note)}
              style={{
                position: 'absolute',
                left: `${note.x}px`,
                top: `${note.y}px`,
                width: `${note.width || 320}px`,
                zIndex: draggingNoteId === note.id ? 40 : note.pinned ? 20 : 10,
              }}
              className="pointer-events-auto transition-shadow cursor-grab active:cursor-grabbing"
            >
              <NoteCard
                note={note}
                onEdit={handleCardEditSafe}
                onDelete={onDeleteNote}
                onToggleArchive={onToggleArchive}
                onTogglePin={onTogglePin}
                onChangeColor={onChangeColor}
                onAiTransform={onAiTransform}
                onAutoNameNote={onAutoNameNote}
                isTransforming={isTransforming}
                transformingNoteId={transformingNoteId}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
