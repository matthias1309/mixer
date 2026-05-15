'use client';

import { useState } from 'react';
import OcrLoading from './OcrLoading';
import OcrReview from './OcrReview';

interface PhotoUploadFormProps {
  onRecipeCreated?: (recipeId: number) => void;
}

export default function PhotoUploadForm({ onRecipeCreated }: PhotoUploadFormProps) {
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'reviewing' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/recipes/ocr', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadId(data.uploadId);
      setStatus('processing');

      // Poll for completion
      pollOcrStatus(data.uploadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    }
  };

  const pollOcrStatus = async (id: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/recipes/ocr/${id}`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.data.status === 'complete') {
          setStatus('reviewing');
          return;
        }

        if (data.data.status === 'error') {
          throw new Error(data.data.error || 'OCR failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Status check failed');
        setStatus('error');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    setError('OCR processing took too long');
    setStatus('error');
  };

  if (status === 'processing' && uploadId) {
    return <OcrLoading />;
  }

  if (status === 'reviewing' && uploadId) {
    return (
      <OcrReview uploadId={uploadId} onRecipeCreated={onRecipeCreated} />
    );
  }

  return (
    <div className="ocr-upload-form">
      <h2>Upload Recipe Photo</h2>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setStatus('idle')}>Try again</button>
        </div>
      )}

      <div className="upload-zone">
        <label htmlFor="photo-input" className="upload-label">
          <span>📷 Click to upload or drag & drop</span>
          <p>JPG or PNG, max 5MB</p>
        </label>
        <input
          id="photo-input"
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          disabled={status === 'uploading'}
        />
      </div>
    </div>
  );
}
