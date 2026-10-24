'use client';

import React from 'react';
import { Search, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import styles from './TextPreview.module.css';

interface TextPreviewProps {
  text: string;
  setText: (text: string) => void;
  onAnalyze: () => void;
  onReset: () => void;
  isLoading: boolean;
  scansLeft: number;
}

export default function TextPreview({ text, setText, onAnalyze, onReset, isLoading, scansLeft }: TextPreviewProps) {
  const isTooLong = text.length > 25000;
  const canAnalyze = !isLoading && !!text.trim() && !isTooLong && scansLeft > 0;
  const progressPct = Math.min(100, (text.length / 25000) * 100);
  const progressColor = isTooLong ? 'var(--danger)' : text.length > 20000 ? 'var(--warning)' : 'var(--primary)';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>Review Extracted Text</div>
        <button
          id="reset-text-btn"
          type="button"
          className={styles.resetBtn}
          onClick={onReset}
          title="Start over with a new document"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <textarea
        id="extracted-text-area"
        className={styles.textArea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Extracted text will appear here. You can edit it before analysis…"
      />

      {/* Character progress bar */}
      <div className={styles.progressRow}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPct}%`, backgroundColor: progressColor }}
          />
        </div>
        <span className={styles.charCount} style={{ color: isTooLong ? 'var(--danger)' : 'var(--muted)' }}>
          {text.length.toLocaleString()}&thinsp;/&thinsp;25,000
        </span>
      </div>

      {isTooLong && (
        <div className={styles.alert}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>Document exceeds the 25,000-character limit. Please trim boilerplate or table of contents sections before analysis.</span>
        </div>
      )}

      <div className={styles.footer}>
        {scansLeft <= 0 ? (
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <button id="upgrade-inline-btn" className={styles.analyzeBtn} style={{ background: 'var(--gradient-hero)' }}>
              <Sparkles size={16} /> Unlock More Scans
            </button>
          </Link>
        ) : (
          <button
            id="analyze-btn"
            className={styles.analyzeBtn}
            onClick={onAnalyze}
            disabled={!canAnalyze}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Analyzing…
              </>
            ) : (
              <>
                <Search size={16} />
                Analyze Risks
              </>
            )}
          </button>
        )}
        {scansLeft > 0 && !isLoading && (
          <span className={styles.scansNote}>
            {scansLeft} free {scansLeft === 1 ? 'scan' : 'scans'} remaining
          </span>
        )}
      </div>
    </div>
  );
}
