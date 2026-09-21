import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Category, TxType } from '../models/types';
import { getCategoryIcon } from '../components/CategoryPicker';
import { generateId } from '../utils/ids';
import { MdArrowBack, MdAdd, MdEdit, MdDelete, MdClose } from 'react-icons/md';

const COLOR_PALETTE = [
  '#ff7043', '#42a5f5', '#ab47bc', '#26a69a', '#ec407a',
  '#ef5350', '#5c6bc0', '#8d6e63', '#78909c', '#66bb6a',
  '#26c6da', '#ffa726', '#ba68c8', '#00b0ff', '#ff5252'
];

const ICON_OPTIONS = [
  'MdRestaurant', 'MdDirectionsBus', 'MdShoppingCart', 'MdReceiptLong',
  'MdMovie', 'MdLocalHospital', 'MdSchool', 'MdHome', 'MdMoreHoriz',
  'MdAttachMoney', 'MdWork', 'MdReplay', 'MdCardGiftcard'
];

export const CategoriesScreen: React.FC = () => {
  const { categories, transactions, addCategory, updateCategory, deleteCategory, goBack, showToast } =
    useAppStore();

  const [activeTab, setActiveTab] = useState<TxType>('EXPENSE');
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#42a5f5');
  const [icon, setIcon] = useState('MdRestaurant');

  // Deletion modal
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string | null>(null);

  const filtered = categories.filter((c) => c.type === activeTab || c.type === 'BOTH');

  const handleOpenAdd = () => {
    setName('');
    setColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
    setIcon(activeTab === 'INCOME' ? 'MdAttachMoney' : 'MdRestaurant');
    setIsNew(true);
    setEditingCat(null);
  };

  const handleOpenEdit = (cat: Category) => {
    setName(cat.name);
    setColor(cat.color);
    setIcon(cat.icon);
    setIsNew(false);
    setEditingCat(cat);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast('Enter a category name');
      return;
    }

    if (isNew) {
      addCategory({
        id: `cat_${generateId().slice(0, 8)}`,
        name: name.trim(),
        type: activeTab,
        icon,
        color,
        order: categories.length + 1,
        builtIn: false
      });
      showToast('Category created');
    } else if (editingCat) {
      updateCategory({
        ...editingCat,
        name: name.trim(),
        color,
        icon
      });
      showToast('Category updated');
    }

    setEditingCat(null);
    setIsNew(false);
  };

  const handleDeletePrompt = (cat: Category) => {
    setDeletingCat(cat);
    setReassignTargetId(null);
  };

  const handleConfirmDelete = () => {
    if (deletingCat) {
      deleteCategory(deletingCat.id, reassignTargetId);
      showToast('Category removed');
      setDeletingCat(null);
    }
  };

  const affectedTxCount = deletingCat
    ? transactions.filter((t) => t.categoryId === deletingCat.id && !t.deletedAt).length
    : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--color-bg)'
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderBottom: '1px solid var(--color-outline)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => goBack()}
            aria-label="Back"
            style={{ width: '44px', height: '44px', color: 'var(--color-text)', fontSize: '24px' }}
          >
            <MdArrowBack />
          </button>
          <span style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text)' }}>
            Manage Categories
          </span>
        </div>

        <button
          onClick={handleOpenAdd}
          aria-label="Add category"
          style={{ width: '44px', height: '44px', color: 'var(--color-primary)', fontSize: '26px' }}
        >
          <MdAdd />
        </button>
      </div>

      {/* Tabs: Expense vs Income */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline)' }}>
        <button
          onClick={() => setActiveTab('EXPENSE')}
          style={{
            flex: 1,
            height: '46px',
            fontSize: '15px',
            fontWeight: 500,
            color: activeTab === 'EXPENSE' ? 'var(--color-primary)' : 'var(--color-text-dim)',
            borderBottom: activeTab === 'EXPENSE' ? '3px solid var(--color-primary)' : 'none'
          }}
        >
          Expense
        </button>
        <button
          onClick={() => setActiveTab('INCOME')}
          style={{
            flex: 1,
            height: '46px',
            fontSize: '15px',
            fontWeight: 500,
            color: activeTab === 'INCOME' ? 'var(--color-primary)' : 'var(--color-text-dim)',
            borderBottom: activeTab === 'INCOME' ? '3px solid var(--color-primary)' : 'none'
          }}
        >
          Income
        </button>
      </div>

      {/* Categories List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.map((cat) => (
          <div
            key={cat.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--color-outline)',
              backgroundColor: 'rgba(255,255,255,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: cat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
              >
                {getCategoryIcon(cat.icon, 20)}
              </div>
              <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
                {cat.name}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleOpenEdit(cat)}
                aria-label="Edit"
                style={{ width: '38px', height: '38px', color: 'var(--color-text-dim)', fontSize: '20px' }}
              >
                <MdEdit />
              </button>
              <button
                onClick={() => handleDeletePrompt(cat)}
                aria-label="Delete"
                style={{ width: '38px', height: '38px', color: 'var(--color-expense)', fontSize: '20px' }}
              >
                <MdDelete />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Category Modal */}
      {(isNew || editingCat) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 150,
            padding: '20px'
          }}
          onClick={() => {
            setIsNew(false);
            setEditingCat(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-sheet)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: 'var(--shadow-menu)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-text)' }}>
                {isNew ? 'New Category' : 'Edit Category'}
              </span>
              <button
                onClick={() => {
                  setIsNew(false);
                  setEditingCat(null);
                }}
                style={{ color: 'var(--color-text-dim)', fontSize: '22px' }}
              >
                <MdClose />
              </button>
            </div>

            <input
              type="text"
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '8px',
                border: '1px solid var(--color-outline)',
                marginBottom: '16px',
                fontSize: '15px'
              }}
            />

            {/* Colors */}
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '8px' }}>
              Color:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {COLOR_PALETTE.map((c) => (
                <div
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    cursor: 'pointer',
                    border: color === c ? '3px solid #ffffff' : 'none'
                  }}
                />
              ))}
            </div>

            {/* Icons */}
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '8px' }}>
              Icon:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {ICON_OPTIONS.map((ic) => (
                <div
                  key={ic}
                  onClick={() => setIcon(ic)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: icon === ic ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                    color: icon === ic ? 'var(--color-on-primary)' : 'var(--color-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {getCategoryIcon(ic, 20)}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setIsNew(false);
                  setEditingCat(null);
                }}
                style={{ padding: '8px 14px', color: 'var(--color-text-dim)', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation with Reassignment */}
      {deletingCat && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 160,
            padding: '20px'
          }}
          onClick={() => setDeletingCat(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-sheet)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: 'var(--shadow-menu)'
            }}
          >
            <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
              Delete "{deletingCat.name}"?
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '14px' }}>
              {affectedTxCount > 0
                ? `${affectedTxCount} transactions currently use this category.`
                : 'No transactions use this category.'}
            </div>

            {affectedTxCount > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '6px' }}>
                  Move existing transactions to:
                </div>
                <select
                  value={reassignTargetId || ''}
                  onChange={(e) => setReassignTargetId(e.target.value ? e.target.value : null)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-outline)'
                  }}
                >
                  <option value="">Uncategorized</option>
                  {categories
                    .filter((c) => c.id !== deletingCat.id && (c.type === deletingCat.type || c.type === 'BOTH'))
                    .map((c) => (
                      <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--color-sheet)' }}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeletingCat(null)}
                style={{ padding: '8px 14px', color: 'var(--color-text-dim)', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-expense)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
