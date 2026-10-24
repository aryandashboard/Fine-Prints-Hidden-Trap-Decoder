'use client';

import React, { useState } from 'react';
import { UploadCloud, FileText, AlertCircle, Lock } from 'lucide-react';
import styles from './Uploader.module.css';

interface UploaderProps {
  onTextExtracted: (text: string) => void;
  onLoading: (isLoading: boolean) => void;
}

const DEMO_TEXT = `TERMS OF SERVICE AGREEMENT

1. RENEWAL AND CANCELLATION
By signing up for the Free Trial, you agree that your subscription will automatically renew at the standard rate of $99/month unless cancelled at least 30 days prior to the end of the current billing period. Early cancellation will result in a $50 processing fee.

2. LIABILITY AND INDEMNIFICATION
User agrees to indemnify and hold harmless the Company against any and all claims. The Company's total liability shall not exceed $1 under any circumstances. You waive all rights to a class-action lawsuit and agree to binding arbitration in a location of our choosing.

3. DATA USAGE
We reserve the right to sell, license, and distribute any data you upload to our servers to third-party marketing affiliates without further notice or compensation.`;

export default function Uploader({ onTextExtracted, onLoading }: UploaderProps) {
  const [pastedText, setPastedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Please upload a file under 5 MB.');
      return;
    }

    onLoading(true);
    try {
      if (file.type === 'application/pdf') {
        await handlePdf(file);
      } else if (file.type.startsWith('image/')) {
        await handleImage(file);
      } else {
        setError('Unsupported file type. Please upload a PDF or image (PNG / JPG).');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to process the file. It may be corrupted or unreadable.');
    } finally {
      onLoading(false);
      e.target.value = '';
    }
  };

  const handlePdf = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/extract-pdf', { method: 'POST', body: formData });
    if (response.ok) {
      const data = await response.json();
      if (!data.text?.trim()) throw new Error('No text found in PDF');
      onTextExtracted(data.text);
    } else {
      throw new Error('PDF extraction failed');
    }
  };

  const handleImage = async (file: File) => {
    const Tesseract = (await import('tesseract.js')).default;
    const result = await Tesseract.recognize(file, 'eng');
    if (!result.data.text?.trim()) throw new Error('No text found in image');
    onTextExtracted(result.data.text);
  };

  const handlePasteSubmit = () => {
    setError(null);
    if (pastedText.trim().length < 20) {
      setError('Please paste more text to analyze (at least 20 characters).');
      return;
    }
    onTextExtracted(pastedText);
  };

  const loadDemo = () => {
    setError(null);
    onTextExtracted(DEMO_TEXT);
  };

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorStrip}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Drop zone */}
      <label className={styles.uploader} htmlFor="file-upload">
        <UploadCloud className={styles.icon} />
        <div className={styles.uploadTitle}>Drag &amp; drop or click to upload</div>
        <div className={styles.subtext}>PDF, PNG, JPG — up to 5 MB</div>
        <input
          id="file-upload"
          type="file"
          className={styles.input}
          accept=".pdf,image/png,image/jpeg,image/jpg"
          onChange={handleFileUpload}
        />
      </label>

      <div className={styles.or}>or paste text</div>

      {/* Paste area */}
      <div>
        <textarea
          id="paste-text-area"
          className={styles.textArea}
          placeholder="Paste your contract, lease, or terms of service here…"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
        />
        <div className={styles.buttonRow}>
          <button
            id="load-sample-btn"
            type="button"
            className={styles.secondaryBtn}
            onClick={loadDemo}
          >
            Load Sample
          </button>
          <button
            id="use-pasted-btn"
            type="button"
            className={styles.primaryBtn}
            onClick={handlePasteSubmit}
            disabled={!pastedText.trim()}
          >
            <FileText size={16} /> Use Pasted Text
          </button>
        </div>
      </div>

      <p className={styles.privacyNote}>
        <Lock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
        Your document is processed only to generate the Safety Card. Avoid uploading sensitive personal data unless necessary.
      </p>
    </div>
  );
}
