import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  Sparkles,
  Wand2,
  Trash2,
  CheckCircle2,
  FilePlus,
  Tag,
  LayoutGrid,
  Archive,
  RefreshCw,
  User,
  Zap,
} from 'lucide-react';
import { AgentMessage, Note, AgentAction } from '../types';

interface AiAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onAutoNameAll: () => Promise<void>;
  onCreateNote: (title: string, content: string, tags?: string[], color?: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onArchiveNotes: (ids: string[], archived: boolean) => void;
  onDeleteNotes: (ids: string[]) => void;
  onArrangeNotes: (layout: string) => void;
}

export const AiAgentDrawer: React.FC<AiAgentDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  onAutoNameAll,
  onCreateNote,
  onUpdateNote,
  onArchiveNotes,
  onDeleteNotes,
  onArrangeNotes,
}) => {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Hello! I'm your AI Note Assistant. I can arrange your notes, generate proper descriptive titles for untitled notes, polish text, archive items, or create new plain text notes for you. How can I help?",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isSending) return;

    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!customPrompt) setInputText('');
    setIsSending(true);

    try {
      const response = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ sender: m.sender, text: m.text })),
          notes,
        }),
      });

      const data = await response.json();
      const actionsPerformed: AgentAction[] = [];

      // Process Tool Function Calls from Gemini
      if (data.functionCalls && Array.isArray(data.functionCalls)) {
        for (const fc of data.functionCalls) {
          const { name, args } = fc;

          if (name === 'auto_name_notes') {
            await onAutoNameAll();
            actionsPerformed.push({
              type: 'auto_name_notes',
              details: 'Generated descriptive titles for all notes',
            });
          } else if (name === 'create_note') {
            onCreateNote(
              args.title || 'New Note',
              args.content || '',
              args.tags || [],
              args.color || 'sky'
            );
            actionsPerformed.push({
              type: 'create_note',
              details: `Created note: "${args.title || 'New Note'}"`,
            });
          } else if (name === 'update_note') {
            if (args.noteId) {
              onUpdateNote(args.noteId, {
                title: args.title,
                content: args.content,
                tags: args.tags,
              });
              actionsPerformed.push({
                type: 'update_note',
                details: `Updated note ID: ${args.noteId}`,
              });
            }
          } else if (name === 'archive_note') {
            if (args.noteIds && Array.isArray(args.noteIds)) {
              onArchiveNotes(args.noteIds, args.archived !== false);
              actionsPerformed.push({
                type: 'archive_note',
                details: `${args.archived !== false ? 'Archived' : 'Restored'} ${args.noteIds.length} notes`,
              });
            }
          } else if (name === 'delete_note') {
            if (args.noteIds && Array.isArray(args.noteIds)) {
              onDeleteNotes(args.noteIds);
              actionsPerformed.push({
                type: 'delete_note',
                details: `Deleted ${args.noteIds.length} notes`,
              });
            }
          } else if (name === 'arrange_notes') {
            onArrangeNotes(args.layoutStyle || 'grid');
            actionsPerformed.push({
              type: 'arrange_notes',
              details: `Arranged notes into ${args.layoutStyle || 'grid'} layout on canvas`,
            });
          }
        }
      }

      const assistantMsg: AgentMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.replyText || 'I have completed your request.',
        timestamp: Date.now(),
        actionsPerformed: actionsPerformed.length > 0 ? actionsPerformed : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Error sending agent message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Sorry, I encountered an issue fulfilling that request. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const QUICK_PROMPTS = [
    { label: '🏷️ Auto-Name All Notes', action: 'Auto-name all my notes based on context.' },
    { label: '🧹 Arrange Canvas Neatly', action: 'Arrange all my notes neatly on the canvas into a grid layout.' },
    { label: '📝 Create Summary Note', action: 'Create a new plain text summary note combining key points from my active notes.' },
    { label: '📥 Archive Completed Notes', action: 'Archive any notes that look completed or contain grocery lists.' },
  ];

  return (
    <div className="ai-drawer-container fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out">
      {/* Drawer Header */}
      <div className="ai-drawer-header px-5 py-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-100 flex items-center gap-1.5 font-mono">
              AI Note Assistant
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-[11px] text-stone-400">Auto-rename, arrange, & manage notes</p>
          </div>
        </div>

        <button
          onClick={onClose}
          id="close-ai-drawer-btn"
          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-stone-500 font-mono">
              {msg.sender === 'user' ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-stone-400" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400 font-semibold">NoteCopilot</span>
                </>
              )}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-none shadow-md'
                  : 'bg-stone-800 text-stone-200 border border-stone-700/80 rounded-tl-none font-mono whitespace-pre-wrap'
              }`}
            >
              {msg.text}

              {/* Action Badges if tool executed */}
              {msg.actionsPerformed && msg.actionsPerformed.length > 0 && (
                <div className="mt-2 pt-2 border-t border-stone-700/60 space-y-1">
                  {msg.actionsPerformed.map((act, i) => (
                    <div
                      key={i}
                      className="px-2 py-1 rounded-md bg-stone-900/90 text-amber-300 text-[10px] border border-amber-500/20 flex items-center gap-1.5 font-sans"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{act.details}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-2 p-3 bg-stone-800/60 border border-stone-700/60 rounded-xl text-xs text-stone-400 font-mono animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>NoteCopilot is analyzing your notes and executing instructions...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Pills */}
      <div className="px-4 py-2 bg-stone-950/60 border-t border-stone-800 overflow-x-auto flex gap-1.5 text-[11px]">
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.action)}
            disabled={isSending}
            className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition font-medium text-nowrap"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-stone-900 border-t border-stone-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            id="agent-chat-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask AI to organize, rename, or create notes..."
            className="flex-1 bg-stone-800 border border-stone-700 text-stone-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500/60 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            id="agent-chat-send-btn"
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
