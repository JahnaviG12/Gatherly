import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './RichNotesEditor.css';
import { FileText, Plus, X, Save, ArrowLeft, Clock, User } from 'lucide-react';

// Quill toolbar configuration
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  ['blockquote', 'code-block'],
  ['link', 'image'],
  ['clean'],
];

const QUILL_MODULES = {
  toolbar: TOOLBAR_OPTIONS,
};

const QUILL_FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet', 'indent',
  'blockquote', 'code-block',
  'link', 'image',
];

// Strip HTML tags to get plain text preview
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

const RichNotesEditor = ({ notes = [], onSave, onDelete, currentUser }) => {
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteTitle, setNoteTitle]       = useState('');
  const [noteContent, setNoteContent]   = useState('');
  const [isSaving, setIsSaving]         = useState(false);
  const quillRef = useRef(null);

  const openNote = (note) => {
    setActiveNoteId(note.id);
    setNoteTitle(note.title || '');
    setNoteContent(note.content || '');
  };

  const createNote = () => {
    const newId = `note_${Date.now()}`;
    setActiveNoteId(newId);
    setNoteTitle('');
    setNoteContent('');
  };

  const closeEditor = () => {
    setActiveNoteId(null);
    setNoteTitle('');
    setNoteContent('');
  };

  const saveNote = async () => {
    if (!noteTitle.trim() && stripHtml(noteContent).trim() === '') return;
    setIsSaving(true);
    const note = {
      id: activeNoteId,
      title: noteTitle || 'Untitled Note',
      content: noteContent,           // HTML string from Quill
      author: currentUser?.username || 'You',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    await onSave(note);
    setIsSaving(false);
    closeEditor();
  };

  // ── NOTE CARD LIST ──
  if (!activeNoteId) {
    return (
      <div className="rne-wrapper">
        <div className="rne-list-header">
          <div>
            <h3 className="rne-heading">Collaborative Notes</h3>
            <p className="rne-subhead">Rich-text workspace documentation</p>
          </div>
          <button className="rne-new-btn" onClick={createNote}>
            <Plus size={16} /> New Note
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="rne-empty">
            <FileText size={40} className="rne-empty-icon" />
            <p className="rne-empty-title">No notes yet</p>
            <p className="rne-empty-sub">Click "New Note" to start documenting with rich text, images, and code blocks.</p>
            <button className="rne-new-btn" onClick={createNote} style={{ marginTop: '1.5rem' }}>
              <Plus size={16} /> Create First Note
            </button>
          </div>
        ) : (
          <div className="rne-cards-grid">
            {notes.map(note => (
              <div key={note.id} className="rne-card" onClick={() => openNote(note)}>
                <button
                  className="rne-card-delete"
                  onClick={e => { e.stopPropagation(); onDelete(note.id); }}
                  title="Delete note"
                >
                  <X size={14} />
                </button>
                <h4 className="rne-card-title">{note.title || 'Untitled Note'}</h4>
                <p className="rne-card-preview">{stripHtml(note.content) || 'No content yet...'}</p>
                <div className="rne-card-meta">
                  <span><User size={11} /> {note.author}</span>
                  <span><Clock size={11} /> {note.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── EDITOR VIEW ──
  return (
    <div className="rne-editor-wrapper">
      <div className="rne-editor-topbar">
        <button className="rne-back-btn" onClick={closeEditor}>
          <ArrowLeft size={16} /> All Notes
        </button>
        <button
          className="rne-save-btn"
          onClick={saveNote}
          disabled={isSaving}
        >
          <Save size={16} /> {isSaving ? 'Saving…' : 'Save Note'}
        </button>
      </div>

      <div className="rne-editor-body">
        <input
          className="rne-title-input"
          type="text"
          placeholder="Note title…"
          value={noteTitle}
          onChange={e => setNoteTitle(e.target.value)}
        />

        <div className="rne-quill-container">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={noteContent}
            onChange={setNoteContent}
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
            placeholder="Start writing… Use the toolbar for headings, lists, code blocks, and more."
          />
        </div>
      </div>
    </div>
  );
};

export default RichNotesEditor;
