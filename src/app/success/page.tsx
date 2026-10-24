import React from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import pageStyles from '../page.module.css';

export default function SuccessPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
      <div style={{ backgroundColor: 'var(--surface)', padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', textAlign: 'center', maxWidth: '500px', margin: '0 1rem' }}>
        <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto 1.5rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--foreground)' }}>Payment Successful!</h1>
        <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
          Thank you for upgrading! Your account has been credited. You can now continue scanning documents with your new plan features.
        </p>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button className={pageStyles.button} style={{ width: '100%', gap: '0.5rem' }}>
            Return to Scanner <ArrowRight size={18} />
          </button>
        </Link>
      </div>
    </div>
  );
}
