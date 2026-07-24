'use client'
import React from 'react';
import Link from 'next/link';
import { FaTwitter, FaInstagram, FaGithub, FaEnvelope, FaPlayCircle } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="footer-animate">
      <div className="footer-content">
        {/* Brand Section */}
        <div className="brand-col">
          <div className="logo">
            <FaPlayCircle size={32} color="#e50914" />
            <span>MovieFlix</span>
          </div>
          <p className="desc">
            Experience the future of streaming with AI-powered recommendations and high-quality cinema.
          </p>
          <div className="social-links">
            <a href="#" aria-label="Twitter"><FaTwitter size={20} /></a>
            <a href="#" aria-label="Instagram"><FaInstagram size={20} /></a>
            <a href="mailto:hello@movieflix.ai" aria-label="Email"><FaEnvelope size={20} /></a>
          </div>
        </div>

        {/* Links Grid */}
        <div className="links-col">
          <h4>Company</h4>
          <Link href="/about">About Us</Link>
          <Link href="/careers">Careers</Link>
          <Link href="#">Press</Link>
        </div>

        <div className="links-col">
          <h4>Legal</h4>
          <Link href="/">Terms of Use</Link>
          <Link href="/">Privacy Policy</Link>
          <Link href="#">Cookie Policy</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} MovieFlix AI Streaming. All Rights Reserved.</p>
      </div>

      <style jsx>{`
        footer {
          padding: 5rem 4% 2rem;
          background: #000;
          color: #777;
          border-top: 1px solid rgba(255,255,255,0.08);
          margin-top: auto;
        }

        .footer-content {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 3rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .brand-col .logo {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 1rem;
        }

        .brand-col .desc {
          max-width: 300px;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .social-links {
          display: flex;
          gap: 1.5rem;
        }

        .social-links a {
          color: #777;
          transition: all 0.3s ease;
        }

        .social-links a:hover {
          color: #e50914;
          transform: translateY(-3px);
        }

        .links-col {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .links-col h4 {
          color: #fff;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .links-col a {
          color: #808080;
          text-decoration: none;
          transition: color 0.3s;
        }

        .links-col a:hover {
          color: #fff;
        }

        .footer-bottom {
          text-align: center;
          margin-top: 4rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          font-size: 0.85rem;
        }

        .footer-animate {
          animation: slideUp 1s ease forwards;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .footer-content { grid-template-columns: 1fr; }
        }
      `}</style>
    </footer>
  );
}