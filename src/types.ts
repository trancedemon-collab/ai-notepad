export interface Note {
  id: string;
  title: string;
  content: string; // Plain text
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  pinned?: boolean;
  tags?: string[];
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string; // e.g. 'neutral', 'amber', 'emerald', 'sky', 'rose', 'indigo', 'violet'
}

export type ViewMode = 'canvas' | 'grid' | 'list';

export type GtkTheme = 'gtk-light' | 'gtk-dark' | 'system';

export type AiTriggerType =
  | 'remove_whitespace'
  | 'polish'
  | 'improve'
  | 'format'
  | 'summarize'
  | 'fix_grammar'
  | 'custom';

export interface AiTransformRequest {
  text: string;
  action: AiTriggerType;
  customInstruction?: string;
  contextTitle?: string;
}

export interface AiTransformResponse {
  transformedText: string;
  originalText: string;
  action: AiTriggerType;
  summary?: string;
}

export interface AgentAction {
  type: 'create_note' | 'update_note' | 'archive_note' | 'delete_note' | 'auto_name_notes' | 'arrange_notes';
  details: string;
  noteId?: string;
}

export interface AgentMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  actionsPerformed?: AgentAction[];
}

export interface NoteArrangeItem {
  id: string;
  x: number;
  y: number;
}
