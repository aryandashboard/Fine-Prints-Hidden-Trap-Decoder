import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fine Prints & Hidden Trap Decoder — AI Contract Risk Analyzer',
  description:
    'Upload a contract, lease, or terms of service and get an instant AI-powered Safety Card highlighting red flags, hidden costs, and negotiation scripts. Free, private, and powered by local AI.',
  keywords: 'contract analyzer, lease review, terms of service checker, hidden fees, red flags, AI legal tool',
  openGraph: {
    title: 'Fine Prints & Hidden Trap Decoder',
    description: 'Spot risky clauses before you sign — AI Safety Cards for contracts, leases, and agreements.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
