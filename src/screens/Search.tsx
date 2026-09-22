import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Transaction } from '../models/types';
import { formatMoney } from '../utils/money';
import { getActiveTransactions } from '../services/calc/engine';
import { MdArrowBack, MdClose, MdAttachFile } from 'react-icons/md';
import { getImageFullUrl } from '../services/storage/indexedDbImages';

export const SearchScreen: React.FC = () => {
  const { transactions, categories, goBack, openEditSheet, openViewer, imageRecords } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Transaction[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Focus search input immediately
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const words = trimmed.split(/\s+/).filter(Boolean);
      const activeTx = getActiveTransactions(transactions);

      const matched = activeTx.filter((tx) => {
        const cat = categories.find((c) => c.id === tx.categoryId);
        const catName = (cat?.name || '').toLowerCase();
        const title = tx.title.toLowerCase();
        const desc = tx.description.toLowerCase();
        const amountMinorStr = tx.amountMinor.toString();
        const rupeesStr = Math.floor(tx.amountMinor / 100).toString();
        const formattedAmt = formatMoney(tx.amountMinor).toLowerCase();

        // Require all words to match at least one field
        return words.every((word) => {
          const cleanWord = word.replace(/[₹,]/g, '');
          return (
            title.includes(word) ||
            desc.includes(word) ||
            catName.includes(word) ||
            amountMinorStr.includes(cleanWord) ||
            rupeesStr.includes(cleanWord) ||
            formattedAmt.includes(word)
          );
        });
      });

      // Sort newest date first
      matched.sort((a, b) => b.date.localeCompare(a.date));
      setResults(matched);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, transactions, categories]);

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
      {/* Top Search Bar */}
      <div
        style={{
          height: '64px',
          backgroundColor: 'var(--color-search-bar)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          gap: '10px',
          position: 'relative'
        }}
      >
        <button
          onClick={() => goBack()}
          aria-label="Back"
          style={{ width: '44px', height: '44px', color: 'var(--color-text)', fontSize: '24px' }}
        >
          <MdArrowBack />
        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder="Search by title, desc, category, amount..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            height: '44px',
            fontSize: '16px',
            color: 'var(--color-text)'
          }}
        />

        {query ? (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear query"
            style={{ width: '44px', height: '44px', color: 'var(--color-text-dim)', fontSize: '22px' }}
          >
            <MdClose />
          </button>
        ) : null}

        {/* 5px mint line under search bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '5px',
            backgroundColor: 'var(--color-primary)'
          }}
        />
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {!query.trim() ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-dim)',
              fontSize: '17px'
            }}
          >
            Type something to search
          </div>
        ) : results.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-dim)',
              fontSize: '17px'
            }}
          >
            No transactions found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => openEditSheet(tx)}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid var(--color-outline)',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div style={{ flex: 1, marginRight: '10px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
                      {tx.date}
                    </div>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 500,
                        color: 'var(--color-text)',
                        marginTop: '2px'
                      }}
                    >
                      {tx.title || 'Untitled'}
                    </div>
                    {tx.description ? (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-dim)',
                          marginTop: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tx.description}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {tx.imageId && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const url = await getImageFullUrl(tx.imageId!);
                          if (url) openViewer(url, tx, imageRecords[tx.imageId!], 0, [tx.imageId!]);
                        }}
                        aria-label="View attachment"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(23, 162, 184, 0.15)',
                          border: '1px solid var(--color-primary)',
                          color: 'var(--color-primary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <MdAttachFile size={13} />
                        <span>View</span>
                      </button>
                    )}
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 500,
                        color: tx.type === 'INCOME' ? 'var(--color-income)' : 'var(--color-expense)'
                      }}
                    >
                      {formatMoney(tx.amountMinor)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
