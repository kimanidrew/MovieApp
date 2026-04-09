import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer-animate" style={{ padding: '5rem 4%', background: '#0a0a0a', color: '#777', textAlign: 'center', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Link href="/about" className="footer-link">About Us</Link>
        <Link href="/careers" className="footer-link">Careers</Link>
        <Link href="/" className="footer-link">Terms of Use</Link>
        <Link href="/" className="footer-link">Privacy Policy</Link>
      </div>
      <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>&copy; {new Date().getFullYear()} MovieFlix AI Streaming. All Rights Reserved.</p>

      <style>{`
        .footer-link {
          color: #808080;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease, transform 0.3s ease;
        }
        .footer-link:hover {
          color: white;
          transform: translateY(-2px);
        }
        .footer-animate {
          animation: slideUp 1s ease forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </footer>
  );
}
