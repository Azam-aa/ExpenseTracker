import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TopBar } from '../components/TopBar';
import { TabStrip } from '../components/TabStrip';
import { ThreeDotMenu } from '../components/ThreeDotMenu';
import { Fab } from '../components/Fab';
import { Note } from '../models/types';
import { formatMonthYear, getPrevMonth, getNextMonth, getTodayDateString } from '../utils/dates';
import { generateId } from '../utils/ids';
import { MdChevronLeft, MdChevronRight, MdEdit, MdCheck, MdClose, MdDelete } from 'react-icons/md';

export const NotesScreen: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote, selectedMonth, setSelectedMonth, showToast } =
    useAppStore();

  const { year, month } = selectedMonth;

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  const handlePrevMonth = () => {
    const prev = getPrevMonth(year, month);
    setSelectedMonth(prev.year, prev.month);
  };

  const handleNextMonth = () => {
    const next = getNextMonth(year, month);
    setSelectedMonth(next.year, next.month);
  };

  const monthPrefix = `${year}-${month.toString().padStart(2, '0')}`;
  const filteredNotes = notes.filter((n) => n.date.startsWith(monthPrefix));

  const handleOpenAdd = () => {
    setTitle('');
    setText('');
    setEditingNote(null);
    setIsAddingNote(true);
  };

  const handleOpenEdit = (note: Note) => {
    setTitle(note.title);
    setText(note.text);
    setEditingNote(note);
    setIsAddingNote(true);
  };

  const handleSave = () => {
    if (!title.trim() && !text.trim()) {
      setIsAddingNote(false);
      return;
    }

    const now = Date.now();
    if (editingNote) {
      updateNote({
        ...editingNote,
        title: title.trim(),
        text: text.trim(),
        updatedAt: now
      });
      showToast('Note updated');
    } else {
      addNote({
        id: generateId(),
        date: getTodayDateString(),
        title: title.trim(),
        text: text.trim(),
        createdAt: now,
        updatedAt: now
      });
      showToast('Note added');
    }

    setIsAddingNote(false);
  };

  const handleDelete = () => {
    if (editingNote) {
      deleteNote(editingNote.id);
      showToast('Note deleted');
      setIsAddingNote(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: 'var(--color-bg)'
      }}
    >
      <TopBar />
      <TabStrip />
      <ThreeDotMenu />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: '96px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Month Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            height: '56px'
          }}
        >
          <button
            onClick={handlePrevMonth}
            aria-label="Previous month"
            style={{ color: 'var(--color-text)', fontSize: '24px' }}
          >
            <MdChevronLeft />
          </button>
          <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--color-text)' }}>
            {formatMonthYear(year, month)}
          </span>
          <button
            onClick={handleNextMonth}
            aria-label="Next month"
            style={{ color: 'var(--color-text)', fontSize: '24px' }}
          >
            <MdChevronRight />
          </button>
        </div>

        {/* Empty State or Notes List */}
        {filteredNotes.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-dim)',
              fontSize: '17px',
              minHeight: '260px'
            }}
          >
            No notes found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 12px' }}>
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleOpenEdit(note)}
                style={{
                  borderRadius: '16px',
                  border: '2px solid var(--color-outline)',
                  padding: '14px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px'
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
                    {note.title || 'Untitled Note'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
                    {note.date}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-dim)', lineHeight: 1.4 }}>
                  {note.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Fab icon={<MdEdit />} onClick={handleOpenAdd} ariaLabel="Add note" />

      {/* Note Add/Edit Sheet */}
      {isAddingNote && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 60
          }}
          onClick={() => setIsAddingNote(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 'var(--app-max-width)',
              backgroundColor: 'var(--color-sheet)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '16px 20px calc(var(--safe-bottom) + 20px) 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '17px', fontWeight: 500, color: 'var(--color-text)' }}>
                {editingNote ? 'Edit Note' : 'New Note'}
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {editingNote && (
                  <button
                    onClick={handleDelete}
                    style={{ color: 'var(--color-expense)', fontSize: '22px' }}
                  >
                    <MdDelete />
                  </button>
                )}
                <button
                  onClick={() => setIsAddingNote(false)}
                  style={{ color: 'var(--color-text-dim)', fontSize: '24px' }}
                >
                  <MdClose />
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                fontSize: '16px',
                padding: '8px 2px',
                borderBottom: '1px solid var(--color-outline)'
              }}
            />

            <textarea
              placeholder="Write a note"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                fontSize: '15px',
                padding: '8px 2px',
                backgroundColor: 'transparent',
                resize: 'none',
                lineHeight: 1.4
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSave}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  fontSize: '26px'
                }}
              >
                <MdCheck />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
