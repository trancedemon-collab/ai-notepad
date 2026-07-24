import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Wand2,
  Sparkles,
  Scissors,
  AlignLeft,
  Check,
  Undo2,
  Copy,
  Download,
  RotateCcw,
  Tag,
  ArrowRight,
  FileText,
  AlertCircle,
  HelpCircle,
  Code,
  Edit3,
  Eye,
  Pencil,
  Maximize2,
  Minimize2,
  Clock,
  Calendar,
} from 'lucide-react';
import { Note, AiTriggerType } from '../types';
import { formatDateTime } from '../lib/dateUtils';

interface PlainEditorProps {
  note: Note;
  onSave: (updatedNote: Note) => void;
  onClose: () => void;
  onAiTransform: (
    text: string,
    action: AiTriggerType,
    customInstruction?: string
  ) => Promise<{ transformedText: string; originalText: string }>;
}

export const PlainEditor: React.FC<PlainEditorProps> = ({
  note,
  onSave,
  onClose,
  onAiTransform,
}) => {
  // Read-only by default when opening note
  const [isEditing, setIsEditing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(true);

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tagsInput, setTagsInput] = useState((note.tags || []).join(', '));
  const [fontStyle, setFontStyle] = useState<'mono' | 'sans' | 'serif'>('mono');
  
  // Selection tracking
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  // AI Transformation preview state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const [previewDiff, setPreviewDiff] = useState<{
    original: string;
    transformed: string;
    action: AiTriggerType;
    isSelection: boolean;
  } | null>(null);

  // History stack for undo
  const [history, setHistory] = useState<string[]>([note.content]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto save draft changes to parent
  useEffect(() => {
    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSave({
      ...note,
      title: title || 'Untitled Plain Note',
      content,
      tags: tagsArray,
      updatedAt: Date.now(),
    });
  }, [title, content, tagsInput]);

  const updateContentWithHistory = (newContent: string) => {
    setContent(newContent);
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(newContent);
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1]);
    }
  };

  // Selection detection
  const handleSelect = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== end) {
        const text = content.slice(start, end);
        setSelectedText(text);
        setSelectionRange({ start, end });
      } else {
        setSelectedText('');
        setSelectionRange(null);
      }
    }
  };

  // Run AI Transformation
  const handleTriggerAi = async (action: AiTriggerType, customInstr?: string) => {
    const targetText = selectedText ? selectedText : content;
    if (!targetText.trim()) return;

    setIsAiLoading(true);
    try {
      const res = await onAiTransform(targetText, action, customInstr);
      setPreviewDiff({
        original: targetText,
        transformed: res.transformedText,
        action,
        isSelection: !!selectedText && selectionRange !== null,
      });
    } catch (err) {
      console.error('AI trigger failed:', err);
    } finally {
      setIsAiLoading(false);
      setShowCustomInput(false);
      setCustomPrompt('');
    }
  };

  // Apply preview diff result
  const handleApplyDiff = () => {
    if (!previewDiff) return;

    if (previewDiff.isSelection && selectionRange) {
      const before = content.slice(0, selectionRange.start);
      const after = content.slice(selectionRange.end);
      const newFullContent = before + previewDiff.transformed + after;
      updateContentWithHistory(newFullContent);
    } else {
      updateContentWithHistory(previewDiff.transformed);
    }
    setPreviewDiff(null);
    setSelectedText('');
    setSelectionRange(null);
  };

  // Export note to .txt file
  const handleDownloadTxt = () => {
    const blob = new Blob([`${title}\n${'=' .repeat(title.length)}\n\n${content}`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'note').toLowerCase().replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Word, char, line calculations
  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = content ? content.length : 0;
  const lineCount = content ? content.split('\n').length : 0;

  const parsedTags = tagsInput
    .split(',')
    .map((t) => t.trim().replace(/^#/, ''))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-2 overflow-hidden">
      <div
        className={`editor-modal-container w-full h-full bg-stone-900 border-stone-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullScreen ? 'rounded-none border-none' : 'max-w-6xl max-h-[96vh] rounded-2xl border'
        }`}
      >
        {/* Modal Header */}
        <div className="editor-modal-header px-4 sm:px-6 py-3 sm:py-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-3">
              {/* Mode Badge Indicator */}
              {isEditing ? (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium flex items-center gap-1.5 flex-shrink-0">
                  <Pencil className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Editing Mode</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1.5 flex-shrink-0">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Read-Only Mode</span>
                </span>
              )}

              {/* Note Title Input or Read-Only Heading */}
              {isEditing ? (
                <input
                  type="text"
                  id="notepad-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title (e.g. Brainstorming Notes)"
                  className="w-full bg-transparent text-lg sm:text-xl font-bold text-stone-100 placeholder-stone-600 focus:outline-none focus:border-b focus:border-amber-500 font-sans tracking-tight"
                  autoFocus
                />
              ) : (
                <h1 className="text-lg sm:text-xl font-bold text-stone-100 font-sans tracking-tight truncate select-text">
                  {title || 'Untitled Plain Note'}
                </h1>
              )}
            </div>

            {/* Note Date & Time Stamp Subheader */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-stone-400 pl-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Created: {formatDateTime(note.createdAt)}</span>
              </span>
              {note.updatedAt && note.updatedAt !== note.createdAt && (
                <span className="hidden sm:inline text-stone-500">
                  • Modified: {formatDateTime(note.updatedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Main EDIT / DONE Toggle Button */}
            {isEditing ? (
              <button
                onClick={() => setIsEditing(false)}
                id="toggle-edit-mode-btn"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Finish editing and switch to read-only mode"
              >
                <Check className="w-4 h-4 text-stone-950" />
                <span>Done Editing</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                id="toggle-edit-mode-btn"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Activate editing mode"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Note</span>
              </button>
            )}

            {/* Font style selector */}
            <div className="bg-stone-800 p-1 rounded-lg border border-stone-700/80 hidden sm:flex items-center text-xs text-stone-400">
              <button
                onClick={() => setFontStyle('mono')}
                id="font-mono-btn"
                className={`px-2 py-0.5 rounded font-mono ${
                  fontStyle === 'mono' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'hover:text-stone-200'
                }`}
              >
                Mono
              </button>
              <button
                onClick={() => setFontStyle('sans')}
                id="font-sans-btn"
                className={`px-2 py-0.5 rounded font-sans ${
                  fontStyle === 'sans' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'hover:text-stone-200'
                }`}
              >
                Sans
              </button>
              <button
                onClick={() => setFontStyle('serif')}
                id="font-serif-btn"
                className={`px-2 py-0.5 rounded font-serif ${
                  fontStyle === 'serif' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'hover:text-stone-200'
                }`}
              >
                Serif
              </button>
            </div>

            {/* Undo button (only active when editing) */}
            {isEditing && (
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                id="undo-btn"
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 disabled:opacity-40 transition"
                title="Undo last text change"
              >
                <Undo2 className="w-4 h-4" />
              </button>
            )}

            {/* Copy button */}
            <button
              onClick={handleCopy}
              id="copy-content-btn"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 transition"
              title="Copy plain text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Download txt button */}
            <button
              onClick={handleDownloadTxt}
              id="download-txt-btn"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 transition"
              title="Download as .txt"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Full screen toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              id="toggle-fullscreen-btn"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 transition hidden sm:flex"
              title={isFullScreen ? 'Restore window size' : 'Expand full screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              id="close-editor-btn"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition"
              title="Close note"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Triggers Sticky Toolbar (When editing) or Read-Only Info Banner */}
        {isEditing ? (
          <div className="px-4 sm:px-6 py-2.5 bg-stone-950/70 border-b border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                AI Triggers
              </span>
              {selectedText && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] border border-amber-500/20">
                  Selection Active ({selectedText.length} chars)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Remove Whitespace Trigger */}
              <button
                onClick={() => handleTriggerAi('remove_whitespace')}
                disabled={isAiLoading}
                id="ai-trigger-whitespace"
                className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition disabled:opacity-50 font-medium"
                title="Remove leading/trailing spaces, fix redundant line breaks"
              >
                <Scissors className="w-3.5 h-3.5 text-sky-400" />
                <span>Remove Whitespace</span>
              </button>

              {/* Polish Text Trigger */}
              <button
                onClick={() => handleTriggerAi('polish')}
                disabled={isAiLoading}
                id="ai-trigger-polish"
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition disabled:opacity-50 font-medium"
                title="Polish grammar, typos, and phrasing"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Polish Text</span>
              </button>

              {/* Improve Content Trigger */}
              <button
                onClick={() => handleTriggerAi('improve')}
                disabled={isAiLoading}
                id="ai-trigger-improve"
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition disabled:opacity-50 font-medium"
                title="Improve conciseness and clarity"
              >
                <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Improve</span>
              </button>

              {/* Format Plain Text Trigger */}
              <button
                onClick={() => handleTriggerAi('format')}
                disabled={isAiLoading}
                id="ai-trigger-format"
                className="px-2.5 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1.5 transition disabled:opacity-50 font-medium"
                title="Format cleanly with plain text bullet points & spacing"
              >
                <AlignLeft className="w-3.5 h-3.5 text-violet-400" />
                <span>Format</span>
              </button>

              {/* Custom Instruction Trigger Toggle */}
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                disabled={isAiLoading}
                id="ai-trigger-custom-toggle"
                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center gap-1.5 transition font-medium"
              >
                <Code className="w-3.5 h-3.5 text-stone-400" />
                <span>Custom Prompt...</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-2 bg-stone-950/60 border-b border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Viewing in <strong>Read-Only Mode</strong>. Text is protected from accidental edits.</span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              id="enable-editing-banner-btn"
              className="text-amber-400 hover:text-amber-300 font-medium text-xs flex items-center gap-1 cursor-pointer transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Enable Editing</span>
            </button>
          </div>
        )}

        {/* Custom AI Prompt Drawer if open */}
        {isEditing && showCustomInput && (
          <div className="px-6 py-3 bg-stone-950 border-b border-stone-800 flex items-center gap-2">
            <input
              type="text"
              id="custom-ai-instruction-input"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTriggerAi('custom', customPrompt)}
              placeholder="e.g. Translate to Spanish, Convert to bulleted action items, Make tone formal..."
              className="flex-1 bg-stone-900 border border-stone-700 text-stone-100 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => handleTriggerAi('custom', customPrompt)}
              disabled={!customPrompt.trim() || isAiLoading}
              id="run-custom-ai-prompt-btn"
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition disabled:opacity-50"
            >
              Run AI
            </button>
          </div>
        )}

        {/* AI Loading Banner */}
        {isAiLoading && (
          <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-center gap-2 text-xs text-amber-300 animate-pulse">
            <RotateCcw className="w-4 h-4 animate-spin" />
            <span>AI is processing your plain text note with Gemini...</span>
          </div>
        )}

        {/* AI Transformation Preview & Diff Drawer */}
        {previewDiff && (
          <div className="px-6 py-4 bg-stone-950/90 border-b border-amber-500/30 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                AI Preview Transformation ({previewDiff.action.replace('_', ' ')})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApplyDiff}
                  id="apply-ai-diff-btn"
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center gap-1 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply Change
                </button>
                <button
                  onClick={() => setPreviewDiff(null)}
                  id="discard-ai-diff-btn"
                  className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                >
                  Discard
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl overflow-y-auto max-h-40 whitespace-pre-wrap text-stone-400">
                <div className="text-[10px] text-stone-500 uppercase font-bold mb-1 font-sans">
                  Original {previewDiff.isSelection ? 'Selection' : 'Text'}
                </div>
                {previewDiff.original}
              </div>
              <div className="p-3 bg-stone-900 border border-amber-500/40 rounded-xl overflow-y-auto max-h-40 whitespace-pre-wrap text-amber-200">
                <div className="text-[10px] text-amber-400 uppercase font-bold mb-1 font-sans">
                  Transformed Plain Text
                </div>
                {previewDiff.transformed}
              </div>
            </div>
          </div>
        )}

        {/* Editor Plain Text Area */}
        <div className="flex-1 p-4 sm:p-8 flex flex-col min-h-0 overflow-hidden">
          <textarea
            ref={textareaRef}
            id="notepad-textarea"
            value={content}
            readOnly={!isEditing}
            onChange={(e) => updateContentWithHistory(e.target.value)}
            onSelect={handleSelect}
            placeholder={
              isEditing
                ? 'Type your plain text note here... Highlighting text enables selection-specific AI triggers.'
                : 'Note content is empty.'
            }
            className={`w-full h-full flex-1 bg-transparent text-stone-200 placeholder-stone-600 focus:outline-none resize-none leading-relaxed border-none ring-0 select-text ${
              !isEditing ? 'cursor-default selection:bg-amber-500/20' : ''
            } ${
              fontStyle === 'mono'
                ? 'font-mono text-xs sm:text-base'
                : fontStyle === 'serif'
                ? 'font-serif text-sm sm:text-lg'
                : 'font-sans text-sm sm:text-lg'
            }`}
          />
        </div>

        {/* Tags Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-stone-950/40 border-t border-stone-800 flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
          {isEditing ? (
            <input
              type="text"
              id="notepad-tags-input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Add tags separated by comma (e.g. work, ideas, meeting)"
              className="flex-1 bg-transparent text-stone-300 text-xs placeholder-stone-600 focus:outline-none font-mono"
            />
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {parsedTags.length > 0 ? (
                parsedTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-xs font-mono border border-stone-700/60"
                  >
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-stone-500 font-mono italic">No tags assigned</span>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer: Live Plain Text Metrics & Status */}
        <div className="px-4 sm:px-6 py-3 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-xs text-stone-500 font-mono">
          <div className="flex items-center gap-3 sm:gap-4">
            <span>{wordsCountText(wordCount)}</span>
            <span>{charCount} characters</span>
            <span className="hidden sm:inline">{lineCount} lines</span>
          </div>

          <div className="flex items-center gap-2 text-stone-400">
            <span
              className={`w-2 h-2 rounded-full ${isEditing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}
            />
            <span className="text-[11px] font-sans">
              {isEditing ? 'Editing Mode' : 'Read-Only Mode'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function wordsCountText(count: number): string {
  return `${count} ${count === 1 ? 'word' : 'words'}`;
}

