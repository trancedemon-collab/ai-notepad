import { Note } from '../types';

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Project Roadmap & Ideas',
    content: `Q3 Development Goals:
  -   Implement plain text notepad with AI triggers
  -   Add drag and drop canvas view
  - Integration with Gemini API for text polishing
  - Smart auto-naming for all messy notes
  
Next steps:
1. Setup express backend server.
2. Build responsive canvas with pan and zoom capabilities.
3. Test whitespace removal and formatting logic.`,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1,
    archived: false,
    pinned: true,
    tags: ['work', 'roadmap'],
    x: 60,
    y: 80,
    width: 320,
    height: 260,
    color: 'sky',
  },
  {
    id: 'note-2',
    title: 'Grocery List & Quick Errands',
    content: `Items to buy:
- Organic almond milk
- Whole grain bread
- Avocados (3)
- Fresh basil & garlic
- Olive oil extra virgin

Errands:
- Drop off dry cleaning
- Mail package at post office before 4 PM`,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 3600000 * 5,
    archived: false,
    pinned: false,
    tags: ['personal', 'shopping'],
    x: 420,
    y: 80,
    width: 280,
    height: 240,
    color: 'emerald',
  },
  {
    id: 'note-3',
    title: 'Draft - Meeting Notes with Product Team',
    content: `meeting notes 07/22

  discuss   new features  and  feedback 
  - user loves canvas view   needs auto arrange
  - text triggers are essential especially   whitespace trim and polish
  - ai agent should be able to rename all untitled notes in 1 click
  
action items:
* team to finalize express server setup
* test streaming response for polish tool`,
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 2,
    archived: false,
    pinned: false,
    tags: ['meeting', 'draft'],
    x: 730,
    y: 80,
    width: 340,
    height: 260,
    color: 'amber',
  },
  {
    id: 'note-4',
    title: 'Archived - Book Quotes & Snippets',
    content: `"Simplicity is prerequisite for reliability." - Edsger W. Dijkstra

"Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away." - Antoine de Saint-Exupéry`,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 8,
    archived: true,
    pinned: false,
    tags: ['quotes', 'reading'],
    x: 60,
    y: 380,
    width: 320,
    height: 200,
    color: 'violet',
  },
];
