import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of GoogleGenAI instance
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// API Route 1: Health Check
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ----------------------------------------------------
// API Route 2: Inline AI Text Triggers (Polish, Format, Remove Whitespace, etc.)
// ----------------------------------------------------
app.post('/api/ai/transform', async (req, res) => {
  try {
    const { text, action, customInstruction, contextTitle } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text content is required' });
    }

    // Client-side quick fallbacks or server AI processing
    if (action === 'remove_whitespace' && !customInstruction) {
      // Deterministic whitespace cleaning + optional intelligent formatting
      const cleaned = text
        .split('\n')
        .map((line) => line.trim().replace(/\s+/g, ' '))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return res.json({
        transformedText: cleaned,
        originalText: text,
        action: 'remove_whitespace',
      });
    }

    const ai = getAi();

    let systemInstruction =
      'You are an expert plain text editor and note enhancer. Output ONLY the processed plain text without any markdown wrappers (do not wrap in ``` or ```text), commentary, quotes, or html tags. Keep it strictly clean plain text.';

    let prompt = '';

    switch (action) {
      case 'remove_whitespace':
        prompt = `Clean and fix whitespace in the following plain text note. Remove redundant blank lines, trim extra trailing/leading spaces, fix weird tab stops, while preserving proper paragraph breaks:\n\n${text}`;
        break;

      case 'polish':
        prompt = `Polish and refine the following text. Fix spelling, typos, grammar errors, and improve sentence flow while strictly preserving the original meaning, tone, and plain text formatting:\n\n${text}`;
        break;

      case 'improve':
        prompt = `Improve the following text for clarity, conciseness, and effectiveness while keeping it in plain text format:\n\n${text}`;
        break;

      case 'format':
        prompt = `Reformat and structure the following text cleanly into plain text. Use plain text conventions (e.g. UPPERCASE headings or clean lines, indented bullet points with '-', neat numbering, consistent spacing). Do NOT use HTML or rich markdown headers:\n\n${text}`;
        break;

      case 'summarize':
        prompt = `Provide a concise plain text summary or key takeaways of the following text using plain bullet points (-):\n\n${text}`;
        break;

      case 'fix_grammar':
        prompt = `Fix all spelling, punctuation, and grammatical mistakes in the following plain text:\n\n${text}`;
        break;

      case 'custom':
        prompt = `Apply the following instruction to the text:\nInstruction: "${customInstruction || 'Improve and organize text'}"\n\nText:\n${text}`;
        break;

      default:
        prompt = `Polish and format the following plain text note cleanly:\n\n${text}`;
    }

    if (contextTitle) {
      prompt = `Note Title context: "${contextTitle}"\n\n` + prompt;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    let transformedText = response.text || text;
    // Strip code block fences if model wrapped them anyway
    transformedText = transformedText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    return res.json({
      transformedText,
      originalText: text,
      action,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/transform:', error);
    res.status(500).json({ error: error.message || 'Failed to transform text' });
  }
});

// ----------------------------------------------------
// API Route 3: Auto-Name Notes
// ----------------------------------------------------
app.post('/api/ai/auto-name', async (req, res) => {
  try {
    const { notes } = req.body; // Array of { id, title, content }

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ error: 'Array of notes is required' });
    }

    const ai = getAi();

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Analyze these notes and generate a concise, descriptive, proper title (2-5 words, no quotes) for each note based on its context and text content.\n\nNotes JSON:\n${JSON.stringify(
        notes.map((n) => ({ id: n.id, currentTitle: n.title, contentSnippet: (n.content || '').slice(0, 300) }))
      )}`,
      config: {
        systemInstruction:
          'Return a valid JSON array of objects with "id" and "suggestedTitle". Output strictly JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              suggestedTitle: { type: Type.STRING, description: 'Proper descriptive 2-5 word title' },
            },
            required: ['id', 'suggestedTitle'],
          },
        },
      },
    });

    let resultJson = [];
    try {
      resultJson = JSON.parse(response.text || '[]');
    } catch (e) {
      console.error('Failed to parse auto-name JSON output', e);
    }

    return res.json({ suggestions: resultJson });
  } catch (error: any) {
    console.error('Error in /api/ai/auto-name:', error);
    res.status(500).json({ error: error.message || 'Failed to auto name notes' });
  }
});

// ----------------------------------------------------
// API Route 4: AI Agent Chat & Note Manager
// ----------------------------------------------------

const autoNameNotesDecl: FunctionDeclaration = {
  name: 'auto_name_notes',
  description: 'Generates proper descriptive titles for all notes or specified notes based on their content.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      noteIds: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Optional list of specific note IDs to rename. If empty, renames all notes that need better titles.',
      },
    },
  },
};

const createNoteDecl: FunctionDeclaration = {
  name: 'create_note',
  description: 'Creates a new plain text note with title, content, and optional tags.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Descriptive title for the note' },
      content: { type: Type.STRING, description: 'Plain text content of the note' },
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Tags associated with the note' },
      color: { type: Type.STRING, description: 'Accent color: sky, emerald, amber, rose, violet, indigo, neutral' },
    },
    required: ['title', 'content'],
  },
};

const updateNoteDecl: FunctionDeclaration = {
  name: 'update_note',
  description: 'Updates an existing note title, content, or tags.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      noteId: { type: Type.STRING, description: 'ID of the note to update' },
      title: { type: Type.STRING, description: 'New title' },
      content: { type: Type.STRING, description: 'New plain text content' },
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Updated tags' },
    },
    required: ['noteId'],
  },
};

const archiveNoteDecl: FunctionDeclaration = {
  name: 'archive_note',
  description: 'Archives or unarchives a note or multiple notes.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      noteIds: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'IDs of the notes to archive or unarchive' },
      archived: { type: Type.BOOLEAN, description: 'True to archive, false to restore/unarchive' },
    },
    required: ['noteIds', 'archived'],
  },
};

const deleteNoteDecl: FunctionDeclaration = {
  name: 'delete_note',
  description: 'Deletes specified notes.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      noteIds: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'IDs of the notes to delete' },
    },
    required: ['noteIds'],
  },
};

const arrangeNotesDecl: FunctionDeclaration = {
  name: 'arrange_notes',
  description: 'Arranges notes neatly on the canvas into an organized grid or clustered layout.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      layoutStyle: {
        type: Type.STRING,
        description: 'Style of arrangement: "grid", "horizontal_row", "vertical_column", or "by_tag"',
      },
    },
  },
};

app.post('/api/ai/agent', async (req, res) => {
  try {
    const { messages, notes } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getAi();

    const notesSummary = (notes || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      contentSnippet: (n.content || '').slice(0, 200),
      archived: n.archived,
      pinned: n.pinned,
      tags: n.tags || [],
    }));

    const systemInstruction = `You are NoteCopilot, an intelligent AI Assistant for a Plain Text Notepad with Canvas View.
Your mission is to help the user manage, organize, polish, structure, auto-name, and summarize their notes.
You have access to tools to auto-name notes, create notes, update notes, archive/unarchive notes, delete notes, and arrange notes on canvas.

Current Notes State in User Notepad:
${JSON.stringify(notesSummary, null, 2)}

When the user asks you to organize, rename, polish, create, delete, or archive notes, invoke the corresponding tool call. Provide clear, direct, polite explanations of actions taken. Always keep text in plain text format.`;

    const lastUserMessage = messages[messages.length - 1]?.text || 'Hello';

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: lastUserMessage,
      config: {
        systemInstruction,
        tools: [
          {
            functionDeclarations: [
              autoNameNotesDecl,
              createNoteDecl,
              updateNoteDecl,
              archiveNoteDecl,
              deleteNoteDecl,
              arrangeNotesDecl,
            ],
          },
        ],
      },
    });

    const replyText = response.text || '';
    const functionCalls = response.functionCalls || [];

    return res.json({
      replyText,
      functionCalls,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/agent:', error);
    res.status(500).json({ error: error.message || 'AI agent error' });
  }
});

// ----------------------------------------------------
// Vite Middleware / Static Assets Handling
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
