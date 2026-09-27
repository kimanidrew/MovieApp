'use client'
import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaInstagram, FaEnvelope } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="footer-animate">
      <div className="footer-content">
        <div className="brand-col">
          <div className="logo"><span className="mark">T</span><span>Tidpix</span></div>
          <p className="desc">Authentically African Movies. Discover stories, filmmakers and cinema from across Africa.</p>
          <div className="social-links">
            <a href="#" aria-label="Facebook"><FaFacebookF size={18} /></a>
            <a href="#" aria-label="Instagram"><FaInstagram size={18} /></a>
            <a href="mailto:info@tidpix.com" aria-label="Email"><FaEnvelope size={18} /></a>
          </div>
        </div>
        <div className="links-col">
          <h4>Explore</h4>
          <Link href="/">Home</Link><Link href="/movies">Movies</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link>
        </div>
        <div className="links-col">
          <h4>Legal</h4>
          <Link href="/terms">Terms of Use</Link><Link href="/privacy">Privacy Policy</Link><Link href="/child-protection">Child Protection</Link>
        </div>
      </div>
      <div className="footer-bottom"><p>&copy; {new Date().getFullYear()} Tidpix. All Rights Reserved.</p></div>
      <style jsx>{`
        footer{padding:5rem 4% 2rem;background:#000;color:#777;border-top:1px solid rgba(244,180,0,.12);margin-top:auto}
        .footer-content{display:grid;grid-template-columns:2fr 1fr 1fr;gap:3rem;max-width:1200px;margin:0 auto}
        .brand-col .logo{display:flex;align-items:center;gap:.8rem;font-size:1.5rem;font-weight:800;color:#fff;margin-bottom:1rem}
        .brand-col .mark{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#f4b400;color:#070707;font-weight:900}
        .brand-col .desc{max-width:320px;line-height:1.6;margin-bottom:1.5rem}
        .social-links{display:flex;gap:1.5rem}.social-links a{color:#777;transition:all .3s}.social-links a:hover{color:#f4b400;transform:translateY(-3px)}
        .links-col{display:flex;flex-direction:column;gap:1rem}.links-col h4{color:#fff;font-size:1.1rem;margin-bottom:.5rem}
        .links-col a{color:#808080;text-decoration:none;transition:color .3s}.links-col a:hover{color:#f4b400}
        .footer-bottom{text-align:center;margin-top:4rem;padding-top:2rem;border-top:1px solid rgba(255,255,255,.05);font-size:.85rem}
        .footer-animate{animation:slideUp 1s ease forwards}@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){.footer-content{grid-template-columns:1fr}}
      `}</style>
    </footer>
  );
}