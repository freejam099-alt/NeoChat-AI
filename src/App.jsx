import React, { useState, useEffect } from 'react'
import {
  Plus, Search, Pin, Trash2, Edit3, Grid, List, Tag,
  Check, X, Palette, Archive, Sparkles, BookOpen, Clock,
  AlertCircle, ChevronRight, Share2, Download, Upload, ExternalLink
} from 'lucide-react'

// Color palette options with light pastel backgrounds, border classes, and darker accent texts
const COLORS = [
  { name: 'Default', bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-800', badge: 'bg-slate-100 text-slate-700' },
  { name: 'Red Pastel', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', badge: 'bg-red-100 text-red-700' },
  { name: 'Yellow Pastel', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-700' },
  { name: 'Green Pastel', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-700' },
  { name: 'Blue Pastel', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-700' },
  { name: 'Purple Pastel', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-700' },
  { name: 'Pink Pastel', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900', badge: 'bg-pink-100 text-pink-700' },
]

const DEFAULT_NOTES = [
  {
    id: '1',
    title: '💡 Quick Start Guide',
    content: 'Welcome to KeepNotes! Here are a few tips to get started:\n\n1. Pin your most important notes using the pin icon 📌.\n2. Add colors to categorize them visually.\n3. Create custom tags to filter notes.\n4. Toggle between grid and list views using the top header icon.',
    color: 'bg-blue-50',
    tags: ['Guide', 'Tips'],
    pinned: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: '🛒 Grocery List',
    content: '- Almond milk\n- Whole wheat bread\n- Organic spinach\n- Avocados\n- Greek yogurt\n- Coffee beans ☕',
    color: 'bg-emerald-50',
    tags: ['Personal', 'List'],
    pinned: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '3',
    title: '✍️ Project Ideas',
    content: '- AI-powered travel planner that generates a custom itinerary based on preferences and budget.\n- Peer-to-peer code review helper extensions.\n- Lightweight Markdown blog generator with zero configuration.',
    color: 'bg-purple-50',
    tags: ['Work', 'Ideas'],
    pinned: false,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
]

export default function App() {
  // --- States ---
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('keepnotes_data')
    return saved ? JSON.parse(saved) : DEFAULT_NOTES
  })

  // Note creation/editing states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)

  // Form input states
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState('bg-white')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])

  // Filtering & View states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('All')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  // Statistics and UI states
  const [isExporting, setIsExporting] = useState(false)
  const [fileImportError, setFileImportError] = useState('')

  // Sync with Local Storage
  useEffect(() => {
    localStorage.setItem('keepnotes_data', JSON.stringify(notes))
  }, [notes])

  // Get unique tags across all notes
  const allTags = ['All', ...Array.from(new Set(notes.flatMap(note => note.tags || [])))]

  // Open note form for creating a new note
  const handleNewNote = () => {
    setEditingNote(null)
    setTitle('')
    setContent('')
    setColor('bg-white')
    setTags([])
    setTagInput('')
    setIsFormOpen(true)
  }

  // Open note form for editing
  const handleEditNote = (note) => {
    setEditingNote(note)
    setTitle(note.title)
    setContent(note.content)
    setColor(note.color || 'bg-white')
    setTags(note.tags || [])
    setTagInput('')
    setIsFormOpen(true)
  }

  // Handle Note Save (Create or Update)
  const handleSaveNote = (e) => {
    e.preventDefault()
    if (!title.trim() && !content.trim()) return

    if (editingNote) {
      // Update existing note
      setNotes(prev => prev.map(note =>
        note.id === editingNote.id
          ? { ...note, title, content, color, tags, createdAt: new Date().toISOString() }
          : note
      ))
    } else {
      // Create new note
      const newNote = {
        id: Date.now().toString(),
        title: title || 'Untitled Note',
        content,
        color,
        tags,
        pinned: false,
        createdAt: new Date().toISOString()
      }
      setNotes(prev => [newNote, ...prev])
    }

    setIsFormOpen(false)
    // Clear inputs
    setTitle('')
    setContent('')
    setColor('bg-white')
    setTags([])
    setTagInput('')
  }

  // Delete note
  const handleDeleteNote = (id, e) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this note?')) {
      setNotes(prev => prev.filter(note => note.id !== id))
    }
  }

  // Toggle Pinned status
  const handleTogglePin = (id, e) => {
    e.stopPropagation()
    setNotes(prev => prev.map(note =>
      note.id === id ? { ...note, pinned: !note.pinned } : note
    ))
  }

  // Tag list helpers
  const handleAddTag = (e) => {
    e.preventDefault()
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  // Quick Tag Add from Input text by pressing comma or Enter
  const handleTagKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault()
      const trimmed = tagInput.trim().replace(/,/g, '')
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed])
        setTagInput('')
      }
    }
  }

  // Export Notes to JSON file
  const handleExportNotes = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `KeepNotes_Backup_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Import Notes from JSON file
  const handleImportNotes = (e) => {
    const fileReader = new FileReader()
    const file = e.target.files[0]
    if (!file) return

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        if (Array.isArray(parsed)) {
          // Perform basic validation
          const isValid = parsed.every(n => n.id && n.title !== undefined && n.content !== undefined)
          if (isValid) {
            setNotes(prev => {
              const existingIds = new Set(prev.map(n => n.id))
              const merged = [...prev]
              parsed.forEach(n => {
                if (!existingIds.has(n.id)) {
                  merged.push(n)
                } else {
                  // duplicate ID handling: generate unique id
                  merged.push({ ...n, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) })
                }
              })
              return merged
            })
            setFileImportError('')
            alert('Notes imported successfully!')
          } else {
            setFileImportError('Invalid backup file format.')
          }
        } else {
          setFileImportError('Backup must be a JSON array.')
        }
      } catch (err) {
        setFileImportError('Failed to parse JSON file.')
      }
    }
    fileReader.readAsText(file)
  }

  // Filter notes based on searchQuery and selectedTag
  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))

    const matchesTag = selectedTag === 'All' || (note.tags && note.tags.includes(selectedTag))

    return matchesSearch && matchesTag
  })

  // Separate pinned and unpinned notes
  const pinnedNotes = filteredNotes.filter(note => note.pinned)
  const unpinnedNotes = filteredNotes.filter(note => !note.pinned)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      {/* --- Main Navigation Header --- */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-100">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                KeepNotes
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">Simple, elegant, and productive</p>
            </div>
          </div>

          {/* Search bar in header */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, tags, or content..."
                className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Actions & Display Control */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleExportNotes}
              title="Export Notes"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Download className="h-5 w-5" />
            </button>
            <label
              title="Import Notes"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="h-5 w-5" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportNotes}
                className="hidden"
              />
            </label>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Grid/List View Selector */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Create Note Button */}
            <button
              onClick={handleNewNote}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-100 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Note</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Content Layout --- */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">

        {/* --- Sidebar Area (Tag Filtration and Statistics) --- */}
        <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6">

          {/* Mobile Search Input (Visible only on mobile/tablet) */}
          <div className="block md:hidden">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Tag filtering sidebar card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-900 text-sm tracking-wide uppercase">Tags</h2>
            </div>
            <div className="flex flex-wrap lg:flex-col gap-1">
              {allTags.map(tag => {
                const count = tag === 'All'
                  ? notes.length
                  : notes.filter(note => note.tags && note.tags.includes(tag)).length

                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`w-auto lg:w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedTag === tag
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedTag === tag ? 'bg-indigo-600' : 'bg-slate-300'}`}></span>
                      {tag}
                    </span>
                    <span className={`text-xs ml-2 px-1.5 py-0.5 rounded-md ${
                      selectedTag === tag ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Statistics Sidebar Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hidden lg:block">
            <h2 className="font-semibold text-slate-900 text-sm tracking-wide uppercase mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Insights
            </h2>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Notes</span>
                <span className="font-semibold text-slate-800">{notes.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Pinned Notes</span>
                <span className="font-semibold text-amber-600">{notes.filter(n => n.pinned).length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Unique Tags</span>
                <span className="font-semibold text-indigo-600">{allTags.length - 1}</span>
              </div>
            </div>
            {fileImportError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{fileImportError}</span>
              </div>
            )}
          </div>
        </aside>

        {/* --- Main Workspace (Notes Grid/List View) --- */}
        <main className="flex-1 flex flex-col gap-8">
          {/* Active Filtering Info banner */}
          {(selectedTag !== 'All' || searchQuery) && (
            <div className="bg-indigo-50 border border-indigo-100 px-4 py-3 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-indigo-800">
                <span>Showing results for</span>
                {selectedTag !== 'All' && (
                  <span className="bg-indigo-200 px-2 py-0.5 rounded-md font-semibold text-indigo-900">Tag: {selectedTag}</span>
                )}
                {searchQuery && (
                  <>
                    <span>matching query</span>
                    <span className="bg-indigo-200 px-2 py-0.5 rounded-md font-semibold text-indigo-900">"{searchQuery}"</span>
                  </>
                )}
              </div>
              <button
                onClick={() => { setSelectedTag('All'); setSearchQuery(''); }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* EMPTY STATE */}
          {filteredNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white border border-dashed border-slate-300 rounded-3xl">
              <div className="bg-slate-100 p-4 rounded-full text-slate-400 mb-4">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No notes found</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                {searchQuery || selectedTag !== 'All'
                  ? "We couldn't find anything matching your filters. Try clearing them or searching for something else."
                  : "Let's create your first note! Click the 'Add Note' button above to organize your thoughts."}
              </p>
              {(searchQuery || selectedTag !== 'All') && (
                <button
                  onClick={() => { setSelectedTag('All'); setSearchQuery(''); }}
                  className="mt-4 text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}

          {/* --- Pinned Section --- */}
          {pinnedNotes.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 tracking-wider uppercase">
                <Pin className="h-4 w-4 fill-current rotate-45" />
                <span>Pinned Notes ({pinnedNotes.length})</span>
              </div>
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
              }>
                {pinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    viewMode={viewMode}
                    onEdit={handleEditNote}
                    onDelete={(e) => handleDeleteNote(note.id, e)}
                    onPin={(e) => handleTogglePin(note.id, e)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* --- Unpinned Section --- */}
          {unpinnedNotes.length > 0 && (
            <section className="space-y-4">
              {pinnedNotes.length > 0 && (
                <div className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  <span>Other Notes ({unpinnedNotes.length})</span>
                </div>
              )}
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
              }>
                {unpinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    viewMode={viewMode}
                    onEdit={handleEditNote}
                    onDelete={(e) => handleDeleteNote(note.id, e)}
                    onPin={(e) => handleTogglePin(note.id, e)}
                  />
                ))}
              </div>
            </section>
          )}

        </main>
      </div>

      {/* --- MODAL FOR ADDING/EDITING NOTE --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          {/* Backdrop blur and darken */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsFormOpen(false)}></div>

          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className={`relative transform overflow-hidden rounded-2xl ${color} border border-slate-200 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl flex flex-col`}>

              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-indigo-600" />
                  {editingNote ? 'Edit Note' : 'Create New Note'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveNote} className="flex-1 flex flex-col">
                <div className="p-6 space-y-6">
                  {/* Note Title Input */}
                  <div>
                    <label htmlFor="note-title" className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">Title</label>
                    <input
                      id="note-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title or main idea..."
                      className="block w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base font-semibold outline-none transition-all"
                    />
                  </div>

                  {/* Note Content Input */}
                  <div>
                    <label htmlFor="note-content" className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">Content</label>
                    <textarea
                      id="note-content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your brilliant thoughts here..."
                      rows={6}
                      className="block w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none transition-all resize-none"
                    ></textarea>
                  </div>

                  {/* Note Color Picker */}
                  <div>
                    <span className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">Note Color</span>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map(c => (
                        <button
                          key={c.bg}
                          type="button"
                          onClick={() => setColor(c.bg)}
                          className={`w-9 h-9 rounded-full ${c.bg} ${c.border} border-2 flex items-center justify-center transition-all transform active:scale-95 hover:scale-105 shadow-sm`}
                          title={c.name}
                        >
                          {color === c.bg && <Check className="h-4 w-4 text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags Input */}
                  <div>
                    <label htmlFor="note-tags" className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">Tags</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          id="note-tags"
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          placeholder="Type a tag and press Comma or Add..."
                          className="flex-1 px-4 py-2 rounded-xl border border-slate-200/80 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {/* Render note's tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {tags.map(t => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100"
                            >
                              {t}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(t)}
                                className="text-indigo-400 hover:text-indigo-700 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Actions Footer */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-colors"
                  >
                    {editingNote ? 'Save Changes' : 'Create Note'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* --- Footer Area --- */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} KeepNotes App. Built for beauty and focus.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Auto-saved to Local Storage
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// --- NoteCard Component ---
function NoteCard({ note, viewMode, onEdit, onDelete, onPin }) {
  const isDefaultColor = !note.color || note.color === 'bg-white'
  // Find matched color configuration or default
  const colorObj = COLORS.find(c => c.bg === note.color) || COLORS[0]

  return (
    <article
      onClick={() => onEdit(note)}
      className={`group relative overflow-hidden rounded-2xl border ${colorObj.border} ${colorObj.bg} p-6 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between min-h-[160px]`}
    >
      <div>
        {/* Top bar inside Note card */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h4 className={`font-bold text-base line-clamp-2 ${colorObj.text}`}>
            {note.title}
          </h4>
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {/* Pin note button */}
            <button
              onClick={(e) => onPin(e)}
              className={`p-1.5 rounded-lg transition-colors ${
                note.pinned
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={note.pinned ? 'Unpin Note' : 'Pin Note'}
            >
              <Pin className={`h-4 w-4 ${note.pinned ? 'fill-current rotate-45 text-amber-600' : ''}`} />
            </button>

            {/* Delete note button */}
            <button
              onClick={(e) => onDelete(e)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Note"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Note body preview */}
        <p className="text-slate-600 text-sm whitespace-pre-wrap line-clamp-6 mb-4">
          {note.content}
        </p>
      </div>

      {/* Footer metadata within note card */}
      <div className="space-y-3 mt-auto">
        {/* Tags badges */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.map(t => (
              <span
                key={t}
                className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${colorObj.badge}`}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Date saved */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span>{new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </article>
  )
}
