'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ShieldCheck, ArrowLeft, Loader2, Lock } from 'lucide-react';
import styles from './page.module.css';

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment integration error. Please check your Stripe keys.';
      alert(message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* ─── Header ─────────────────────────────── */}
      <header style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            <ShieldCheck size={24} style={{ color: 'var(--danger)', WebkitTextFillColor: 'var(--danger)' }} />
            Fine Prints Decoder
          </Link>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            color: 'var(--muted)', fontSize: '0.875rem', fontWeight: 600,
          }}>
            <ArrowLeft size={15} /> Back to Scanner
          </Link>
        </div>
      </header>

      {/* ─── Main content ───────────────────────── */}
      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.badge}>Pricing</div>
          <h1 className={styles.title}>Simple, transparent pricing</h1>
          <p className={styles.subtitle}>
            Don&apos;t get caught by hidden traps. Upgrade to protect yourself from unfair contracts, subscriptions, and leases.
          </p>
        </div>

        <div className={styles.grid}>
          {/* ─── Free Plan ──────────────────── */}
          <div className={styles.card}>
            <div className={styles.planName}>Free</div>
            <div className={styles.price}>$0<span className={styles.period}>/mo</span></div>
            <p className={styles.description}>Perfect for occasional users who want basic protection before signing.</p>
            <ul className={styles.features}>
              {['3 scans per month', 'Basic Safety Cards', 'PDF & image upload', 'Copy to clipboard'].map(f => (
                <li key={f} className={styles.feature}>
                  <span className={styles.featureIcon}><Check size={11} /></span>
                  {f}
                </li>
              ))}
            </ul>
            <Link id="free-plan-btn" href="/" className={styles.button} style={{ border: '2px solid var(--border)', color: 'var(--muted)', background: 'transparent', textAlign: 'center', display: 'block', textDecoration: 'none' }}>
              Current Plan
            </Link>
          </div>

          {/* ─── Plus Plan ──────────────────── */}
          <div className={`${styles.card} ${styles.popular}`}>
            <div className={styles.popularBadge}>Most Popular</div>
            <div className={styles.planName}>Plus</div>
            <div className={styles.price}>$12<span className={styles.period}>/mo</span></div>
            <p className={styles.description}>For freelancers and renters who review documents regularly.</p>
            <ul className={styles.features}>
              {['50 scans per month', 'Advanced AI model', 'Save to PDF', 'Priority processing', 'Email support'].map(f => (
                <li key={f} className={styles.feature}>
                  <span className={styles.featureIcon}><Check size={11} /></span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              id="plus-plan-btn"
              className={`${styles.button} ${styles.buttonSolid}`}
              onClick={() => handleCheckout('price_plus')}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === 'price_plus' ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Loader2 className={styles.loading} size={17} /> Redirecting…
                </span>
              ) : 'Upgrade to Plus'}
            </button>
          </div>

          {/* ─── Pro Plan ───────────────────── */}
          <div className={styles.card}>
            <div className={styles.planName}>Pro</div>
            <div className={styles.price}>$29<span className={styles.period}>/mo</span></div>
            <p className={styles.description}>For small businesses reviewing vendor agreements and B2B contracts.</p>
            <ul className={styles.features}>
              {['Unlimited scans', 'Multi-page PDF analysis', 'Priority support', 'Document storage (optional)', 'Team access (coming soon)'].map(f => (
                <li key={f} className={styles.feature}>
                  <span className={styles.featureIcon}><Check size={11} /></span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              id="pro-plan-btn"
              className={`${styles.button} ${styles.buttonOutline}`}
              onClick={() => handleCheckout('price_pro')}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === 'price_pro' ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Loader2 className={styles.loading} size={17} /> Redirecting…
                </span>
              ) : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

        {/* ─── Guarantee ──────────────────────────── */}
        <p className={styles.guarantee}>
          <Lock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          Payments are secured by Stripe. Cancel anytime — no questions asked.
        </p>
      </main>
    </div>
  );
}
