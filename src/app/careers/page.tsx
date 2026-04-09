import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Careers - MovieFlix',
  description: 'Join our global network of top-tier engineers designing AI-augmented streaming platforms.',
};

export default function CareersPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at top right, #1a0505 0%, #050505 100%)', color: '#fff' }}>
      <Navbar />
      
      <div className="animate-in" style={{ flex: 1, padding: '12rem 4% 8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ padding: '0.5rem 1rem', background: 'rgba(229, 9, 20, 0.1)', color: '#e50914', borderRadius: '50px', fontSize: '0.9rem', fontWeight: 600, marginBottom: '2rem' }}>We're Hiring!</div>
        
        <h1 style={{ fontSize: '4.5rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center', lineHeight: 1.1 }}>
          Build the Future of<br/>Streaming.
        </h1>
        
        <p style={{ maxWidth: '600px', fontSize: '1.2rem', color: '#888', textAlign: 'center', marginBottom: '5rem', lineHeight: 1.8 }}>
          Join our global network of top-tier engineers designing AI-augmented streaming platforms at a massive scale.
        </p>

        <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { role: 'Senior AI Video Engineer', dept: 'Engineering - Remote' },
            { role: 'Frontend React Architect', dept: 'Engineering - Remote' },
            { role: 'Product Marketing Manager', dept: 'Marketing - New York' },
            { role: 'Site Reliability / CDN Expert', dept: 'Infrastructure - London' }
          ].map((job, i) => (
            <div key={i} className="job-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.3s ease', cursor: 'pointer' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{job.role}</h3>
                <p style={{ color: '#777', fontSize: '0.9rem' }}>{job.dept}</p>
              </div>
              <button style={{ background: '#fff', color: '#000', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Apply</button>
            </div>
          ))}
          <style>{`.job-hover:hover { background: rgba(255,255,255,0.08) !important; }`}</style>
        </div>
      </div>

      <Footer />
    </main>
  );
}
