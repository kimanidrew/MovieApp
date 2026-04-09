import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'About Us - MovieFlix',
  description: 'Built with cutting-edge next-generation adaptive HLS technologies.',
};

export default function AboutPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff' }}>
      <Navbar />
      
      <div className="animate-in" style={{ flex: 1, padding: '12rem 4% 8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '2rem', background: 'linear-gradient(45deg, #e50914, #ff4c4c, #ffb400)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center', letterSpacing: '-1px' }}>
          Redefining Cinema
        </h1>
        
        <p style={{ maxWidth: '800px', fontSize: '1.3rem', lineHeight: 1.8, color: '#aaa', textAlign: 'center', marginBottom: '4rem' }}>
          MovieFlix represents the next evolution of digital entertainment. Built with cutting-edge next-generation adaptive HLS technologies natively powered by AI recommendations from Gemini, we deliver a buffer-free, immersive viewing experience worldwide.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%', maxWidth: '1100px' }}>
          {[
            { title: 'AI Driven', text: 'Smart recommendations built intuitively off your viewing emotion and history.' },
            { title: 'Zero Buffering', text: 'Adaptive HTTP Live Streaming natively switches resolutions to keep the frame perfect.' },
            { title: 'Cinematic Visuals', text: 'Stunning premium user interfaces that bring the theatrical feeling directly to your home.' }
          ].map((feature, i) => (
            <div key={i} className="hover-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', transition: 'transform 0.3s ease', cursor: 'pointer' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>{feature.title}</h3>
              <p style={{ color: '#888', lineHeight: 1.6 }}>{feature.text}</p>
            </div>
          ))}
          <style>{`.hover-card:hover { transform: translateY(-10px); }`}</style>
        </div>
      </div>

      <Footer />
    </main>
  );
}
