import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'My List - MovieFlix',
  description: 'Your personalized collection of shows and movies.',
};

export default function MyListPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#141414', color: '#fff' }}>
      <Navbar />
      
      <div className="animate-in" style={{ flex: 1, padding: '10rem 4% 4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', width: '100%', maxWidth: '600px' }}>
          <svg style={{ color: '#888', marginBottom: '1.5rem' }} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4v16m8-8H4"/></svg>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Your List is Empty</h2>
          <p style={{ color: '#777', fontSize: '1.1rem', marginBottom: '2rem' }}>Add shows and movies to your list so you can easily find them later.</p>
          <Link href="/movies" style={{ textDecoration: 'none', display: 'inline-block', background: '#e50914', color: '#fff', border: 'none', padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 600, borderRadius: '4px', cursor: 'pointer' }}>
            Explore Now
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
