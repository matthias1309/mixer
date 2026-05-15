import { TESSERACT_CONFIG } from './constants';

// Mock OCR for server-side processing
// In production, consider using: Google Cloud Vision, AWS Textract, or client-side Tesseract.js
export async function extractTextFromImage(
  imageBuffer: Buffer | Uint8Array
): Promise<string> {
  try {
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // For now, return mock data based on image size
    // In production, integrate with real OCR service
    const mockTexts = [
      '500g Spaghetti\n200g Speck\n3 Eier\n100g Parmesan\n10g Salz\n5g Pfeffer',
      '2 Karotten\n3 Kartoffeln\n1 Zwiebel\n400ml Gemüsebrühe\n200g Spinat\n50ml Olivenöl\n10g Salz\n5g Pfeffer',
      '250g Mehl\n250g Zucker\n75g Kakaopulver\n2 Eier\n250ml Milch\n5ml Vanilleextrakt\n10g Backpulver',
      '1 Kopf Salat\n100g Croutons\n50g Parmesan\n30ml Salatdressing\n5g Schwarzpfeffer',
      '300g Risottoreis\n400g Tomaten\n1 Zwiebel\n400ml Gemüsebrühe\n100g Parmesan\n30ml Olivenöl',
    ];

    // Return a random mock recipe
    const text = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

export async function terminateWorker(): Promise<void> {
  // No-op for mock implementation
}
