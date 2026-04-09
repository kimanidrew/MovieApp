"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './upload.css';

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      router.push(`/watch/${data.video.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h1 className="upload-title">Upload a Movie</h1>
        <p className="upload-subtitle">Add a new blockbuster to MovieFlix</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="title">Movie Title</label>
            <input type="text" id="title" name="title" required placeholder="e.g. Inception" />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={3} placeholder="Synopsis..."></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="releaseYear">Release Year</label>
            <input type="number" id="releaseYear" name="releaseYear" defaultValue={new Date().getFullYear()} />
          </div>
          
          <div className="form-group file-group">
            <label htmlFor="video">Video File (MP4/WebM)</label>
            <input type="file" id="video" name="video" accept="video/mp4,video/webm" required />
          </div>
          
          <div className="form-group file-group">
            <label htmlFor="thumbnail">Thumbnail (JPG/PNG)</label>
            <input type="file" id="thumbnail" name="thumbnail" accept="image/jpeg,image/png" />
          </div>
          
          <button type="submit" disabled={isUploading} className={`btn-submit ${isUploading ? 'loading' : ''}`}>
            {isUploading ? 'Uploading...' : 'Upload Movie'}
          </button>
        </form>
      </div>
    </div>
  );
}
