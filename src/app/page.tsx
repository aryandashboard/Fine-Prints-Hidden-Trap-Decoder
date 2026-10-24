'use client';

import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Zap, FileSearch } from 'lucide-react';
import Link from 'next/link';
import Uploader from '@/components/Uploader';
import TextPreview from '@/components/TextPreview';
import SafetyCard, { type SafetyCardData } from '@/components/SafetyCard';
import styles from './page.module.css';

export default function Home() {
  const [extractedText, setExtractedText] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SafetyCardData | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Simulated free usage counter (in-memory, resets on page reload)
  const [scansLeft, setScansLeft] = useState(3);

  const handleAnalyze = async () => {
    if (!extractedText.trim()) return;
    if (scansLeft <= 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed. Please try again.');
      }

      setAnalysisResult(data.result);
      setScansLeft(prev => Math.max(0, prev - 1));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unexpected error. Please try again.';
      setAnalysisError(msg);
      console.error('[analyze]', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setExtractedText('');
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  const scansLow = scansLeft <= 1;

  return (
    <div className={styles.main}>
      {/* ─── Sticky header ─────────────────────────── */}
      <header className={styles.header}>
        <div className={`container ${styles.headerContent}`}>
          <div className={styles.logo}>
            <ShieldCheck className={styles.logoIcon} size={26} />
            Fine Prints Decoder
          </div>

          <div className={styles.headerRight}>
            <span className={`${styles.scanBadge} ${scansLow ? styles.scanBadgeLow : ''}`}>
              <span className={`${styles.scanBadgeDot} ${scansLow ? styles.scanBadgeDotLow : ''}`} />
              {scansLeft} {scansLeft === 1 ? 'scan' : 'scans'} left
            </span>
            <Link href="/pricing">
              <button id="upgrade-btn" className={styles.button}>
                <Sparkles size={15} /> Upgrade
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero strip ────────────────────────────── */}
      <div className={styles.heroStrip}>
        <h1 className={styles.heroTitle}>
          Decode Hidden Traps Before You Sign
        </h1>
        <p className={styles.heroSub}>
          Upload any contract, lease, or terms of service — get an instant AI Safety Card highlighting red flags, hidden fees, and negotiation questions.
        </p>
      </div>

      {/* ─── Main content ──────────────────────────── */}
      <main className="container">

        {/* Disclaimer */}
        <div className={styles.disclaimer}>
          <span className={styles.disclaimerIcon}><Zap size={15} /></span>
          <p>
            <strong>Not legal advice.</strong> This AI-generated Safety Card helps you spot potential issues before consulting a qualified professional. Always review the full document yourself.
          </p>
        </div>

        {/* Error banner */}
        {analysisError && (
          <div style={{
            backgroundColor: 'var(--danger-light)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            padding: '0.875rem 1.125rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeInUp 0.3s ease-out forwards',
          }}>
            ⚠️ {analysisError}
          </div>
        )}

        {/* Scan exhausted banner */}
        {scansLeft <= 0 && (
          <div style={{
            background: 'var(--gradient-hero)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.9375rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <span>🎉 You&apos;ve used all your free scans.</span>
            <Link href="/pricing">
              <button className={styles.button} style={{ background: 'white', color: 'var(--primary)', boxShadow: 'none' }}>
                <Sparkles size={15} /> Unlock More
              </button>
            </Link>
          </div>
        )}

        <div className={styles.content}>
          {/* Left column — Upload / Preview */}
          <div className={styles.leftCol}>
            {!extractedText ? (
              <div className={styles.panel}>
                <div className={styles.panelTitle}>
                  <FileSearch size={18} style={{ color: 'var(--primary)' }} />
                  Upload Document
                </div>
                {isLoadingFile ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--primary)' }}>
                    <div className={styles.loading} style={{
                      width: '32px', height: '32px',
                      border: '3px solid var(--border)',
                      borderTopColor: 'var(--primary)',
                      borderRadius: '50%',
                      margin: '0 auto 1rem',
                    }} />
                    <p style={{ fontWeight: 600 }}>Extracting text…</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.25rem' }}>This may take a moment for large files.</p>
                  </div>
                ) : (
                  <Uploader
                    onTextExtracted={setExtractedText}
                    onLoading={setIsLoadingFile}
                  />
                )}
              </div>
            ) : (
              <div className={styles.panel}>
                <TextPreview
                  text={extractedText}
                  setText={setExtractedText}
                  onAnalyze={handleAnalyze}
                  onReset={handleReset}
                  isLoading={isAnalyzing}
                  scansLeft={scansLeft}
                />
              </div>
            )}
          </div>

          {/* Right column — Safety Card or empty state */}
          <div className={styles.rightCol}>
            {analysisResult ? (
              <SafetyCard data={analysisResult} onNewScan={handleReset} />
            ) : (
              <div className={styles.emptyCard}>
                <ShieldCheck className={styles.emptyCardIcon} size={52} />
                <p className={styles.emptyCardText}>
                  Your <strong>AI Safety Card</strong> will appear here after analysis — highlighting red flags, hidden costs, and questions to ask before signing.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
