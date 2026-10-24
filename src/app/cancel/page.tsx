import React from 'react';
import Link from 'next/link';
import { XCircle, ArrowLeft } from 'lucide-react';
import pageStyles from '../page.module.css';

export default function CancelPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
      <div style={{ backgroundColor: 'var(--surface)', padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', textAlign: 'center', maxWidth: '500px', margin: '0 1rem' }}>
        <XCircle size={64} style={{ color: 'var(--warning)', margin: '0 auto 1.5rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--foreground)' }}>Checkout Cancelled</h1>
        <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
          Your payment was cancelled and you have not been charged. You can continue using your current plan or try upgrading again later.
        </p>
        <Link href="/pricing" style={{ textDecoration: 'none' }}>
          <button className={`${pageStyles.button} ${pageStyles.secondary}`} style={{ width: '100%', gap: '0.5rem', backgroundColor: 'var(--surface-hover)', color: 'var(--foreground)' }}>
            <ArrowLeft size={18} /> Back to Pricing
          </button>
        </Link>
      </div>
    </div>
  );
}
