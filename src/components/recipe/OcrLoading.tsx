'use client';

export default function OcrLoading() {
  return (
    <div className="ocr-loading">
      <div className="spinner"></div>
      <h2>Processing your recipe photo...</h2>
      <p>Extracting text and identifying ingredients</p>
      <p className="subtitle">(This usually takes 3-5 seconds)</p>
    </div>
  );
}
