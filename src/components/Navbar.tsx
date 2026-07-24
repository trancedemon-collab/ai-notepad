import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  LayoutGrid,
  Maximize2,
  Archive,
  Search,
  Bot,
  Grid,
  RotateCw,
  Wand2,
  CheckCircle2,
  FileText,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Check,
} from 'lucide-react';
import { ViewMode, GtkTheme } from '../types';

interface NavbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  filterArchived: 'active' | 'archived' | 'all';
  setFilterArchived: (filter: 'active' | 'archived' | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNewNote: () => void;
  onAutoNameAll: () => void;
  onAutoArrange: () => void;
  toggleAiDrawer: () => void;
  isAiDrawerOpen: boolean;
  isAutoNaming: boolean;
  activeCount: number;
  archivedCount: number;
  gtkTheme: GtkTheme;
  setGtkTheme: (theme: GtkTheme) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  filterArchived,
  setFilterArchived,
  searchQuery,
  setSearchQuery,
  onNewNote,
  onAutoNameAll,
  onAutoArrange,
  toggleAiDrawer,
  isAiDrawerOpen,
  isAutoNaming,
  activeCount,
  archivedCount,
  gtkTheme,
  setGtkTheme,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const getThemeIcon = () => {
    switch (gtkTheme) {
      case 'gtk-light':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'gtk-dark':
        return <Moon className="w-3.5 h-3.5 text-sky-400" />;
      case 'system':
      default:
        return <Monitor className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getThemeLabel = () => {
    switch (gtkTheme) {
      case 'gtk-light':
        return 'GTK Light';
      case 'gtk-dark':
        return 'GTK Dark';
      case 'system':
      default:
        return 'System (Auto)';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 text-stone-100 px-4 py-3 transition-colors">
      {/* Backdrop overlay to close theme menu when clicking outside */}
      {showThemeMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowThemeMenu(false)}
        />
      )}

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-40">
        {/* Left: Brand / Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-md shadow-amber-900/20">
              <FileText className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-2 font-mono">
                AI Canvas Notepad
                <span className="text-[10px] uppercase font-sans tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Plain Text
                </span>
              </h1>
              <p className="text-xs text-stone-400 hidden sm:block">
                Smart notes with integrated AI triggers & assistant
              </p>
            </div>
          </div>

          {/* Mobile AI drawer toggle & Theme Selector */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Theme Switcher */}
            <div className="relative z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowThemeMenu(!showThemeMenu);
                }}
                id="mobile-theme-selector-btn"
                className="p-1.5 rounded-lg bg-stone-800 text-stone-200 border border-stone-700 text-xs flex items-center gap-1"
                title="Change Theme"
              >
                {getThemeIcon()}
              </button>
              {showThemeMenu && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-48 bg-stone-900 border border-stone-700 rounded-xl p-1.5 shadow-2xl text-xs space-y-1">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-stone-400 font-mono tracking-wider">
                    GTK Themes
                  </div>
                  <button
                    onClick={() => {
                      setGtkTheme('gtk-light');
                      setShowThemeMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition ${
                      gtkTheme === 'gtk-light'
                        ? 'bg-amber-500/10 text-amber-300 font-semibold'
                        : 'hover:bg-stone-800 text-stone-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      GTK Light
                    </span>
                    {gtkTheme === 'gtk-light' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                  <button
                    onClick={() => {
                      setGtkTheme('gtk-dark');
                      setShowThemeMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition ${
                      gtkTheme === 'gtk-dark'
                        ? 'bg-amber-500/10 text-amber-300 font-semibold'
                        : 'hover:bg-stone-800 text-stone-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Moon className="w-3.5 h-3.5 text-sky-400" />
                      GTK Dark
                    </span>
                    {gtkTheme === 'gtk-dark' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                  <button
                    onClick={() => {
                      setGtkTheme('system');
                      setShowThemeMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition ${
                      gtkTheme === 'system'
                        ? 'bg-amber-500/10 text-amber-300 font-semibold'
                        : 'hover:bg-stone-800 text-stone-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                      System (Auto)
                    </span>
                    {gtkTheme === 'system' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={toggleAiDrawer}
              id="mobile-ai-drawer-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium"
            >
              <Bot className="w-4 h-4" />
              <span>AI Agent</span>
            </button>
          </div>
        </div>

        {/* Center: Search & Filter Tabs */}
        <div className="flex flex-1 max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              id="search-notes-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plain text notes..."
              className="w-full bg-stone-800/80 border border-stone-700/80 text-stone-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 text-xs"
              >
                ×
              </button>
            )}
          </div>

          <div className="bg-stone-800/90 p-1 rounded-xl border border-stone-700/70 flex items-center text-xs text-stone-400 flex-shrink-0">
            <button
              onClick={() => setFilterArchived('active')}
              id="filter-active-btn"
              className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
                filterArchived === 'active'
                  ? 'bg-stone-700 text-amber-400 font-semibold shadow-sm'
                  : 'hover:text-stone-200'
              }`}
            >
              Active <span className="opacity-60 text-[10px]">({activeCount})</span>
            </button>
            <button
              onClick={() => setFilterArchived('archived')}
              id="filter-archived-btn"
              className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
                filterArchived === 'archived'
                  ? 'bg-stone-700 text-amber-400 font-semibold shadow-sm'
                  : 'hover:text-stone-200'
              }`}
            >
              <Archive className="w-3 h-3 inline" />
              Archived <span className="opacity-60 text-[10px]">({archivedCount})</span>
            </button>
          </div>
        </div>

        {/* Right: Actions, View Modes, AI Actions */}
        <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
          {/* View Mode Toggle */}
          <div className="bg-stone-800/90 p-1 rounded-xl border border-stone-700/70 flex items-center flex-shrink-0">
            <button
              onClick={() => setViewMode('canvas')}
              id="view-mode-canvas-btn"
              title="Interactive Canvas View"
              className={`p-1.5 rounded-lg text-xs transition flex items-center gap-1 font-medium ${
                viewMode === 'canvas'
                  ? 'bg-stone-700 text-amber-400 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Canvas</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              id="view-mode-grid-btn"
              title="Masonry Grid View"
              className={`p-1.5 rounded-lg text-xs transition flex items-center gap-1 font-medium ${
                viewMode === 'grid'
                  ? 'bg-stone-700 text-amber-400 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Grid</span>
            </button>
          </div>

          {/* Desktop Theme Switcher */}
          <div className="relative hidden md:block z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowThemeMenu(!showThemeMenu);
              }}
              id="desktop-theme-selector-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 hover:border-amber-500/30 text-xs font-medium transition cursor-pointer"
              title="Select Theme"
            >
              {getThemeIcon()}
              <span>{getThemeLabel()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-48 bg-stone-900 border border-stone-700 rounded-xl p-1.5 shadow-2xl text-xs space-y-1">
                <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-stone-400 font-mono tracking-wider">
                  GTK Theme Options
                </div>
                <button
                  onClick={() => {
                    setGtkTheme('gtk-light');
                    setShowThemeMenu(false);
                  }}
                  id="theme-gtk-light-btn"
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition ${
                    gtkTheme === 'gtk-light'
                      ? 'bg-amber-500/10 text-amber-300 font-semibold'
                      : 'hover:bg-stone-800 text-stone-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    GTK Light
                  </span>
                  {gtkTheme === 'gtk-light' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
                <button
                  onClick={() => {
                    setGtkTheme('gtk-dark');
                    setShowThemeMenu(false);
                  }}
                  id="theme-gtk-dark-btn"
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition ${
                    gtkTheme === 'gtk-dark'
                      ? 'bg-amber-500/10 text-amber-300 font-semibold'
                      : 'hover:bg-stone-800 text-stone-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 text-sky-400" />
                    GTK Dark
                  </span>
                  {gtkTheme === 'gtk-dark' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
                <button
                  onClick={() => {
                    setGtkTheme('system');
                    setShowThemeMenu(false);
                  }}
                  id="theme-system-btn"
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition ${
                    gtkTheme === 'system'
                      ? 'bg-amber-500/10 text-amber-300 font-semibold'
                      : 'hover:bg-stone-800 text-stone-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                    System (Auto)
                  </span>
                  {gtkTheme === 'system' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              </div>
            )}
          </div>

          {/* AI Auto Name All Notes Button */}
          <button
            onClick={onAutoNameAll}
            disabled={isAutoNaming || activeCount === 0}
            id="auto-name-all-btn"
            title="AI generates smart descriptive names for all notes"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 hover:border-amber-500/40 text-xs font-medium transition disabled:opacity-50"
          >
            {isAutoNaming ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">Auto-Name Notes</span>
          </button>

          {/* AI Auto Arrange Canvas */}
          {viewMode === 'canvas' && (
            <button
              onClick={onAutoArrange}
              id="auto-arrange-btn"
              title="Arrange notes neatly on canvas"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 hover:border-stone-600 text-xs font-medium transition"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline">Arrange</span>
            </button>
          )}

          {/* New Note Button */}
          <button
            onClick={onNewNote}
            id="create-new-note-btn"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs shadow-md shadow-amber-500/10 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>

          {/* Desktop AI Agent Drawer Toggle */}
          <button
            onClick={toggleAiDrawer}
            id="toggle-ai-agent-drawer-btn"
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              isAiDrawerOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-stone-800 text-stone-200 border-stone-700 hover:border-amber-500/30 hover:text-amber-300'
            }`}
          >
            <Bot className="w-4 h-4 text-amber-400" />
            <span>AI Assistant</span>
          </button>
        </div>
      </div>
    </header>
  );
};
