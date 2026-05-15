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
      'Pasta Carbonara\n500g spaghetti\n200g bacon\n3 eggs\n100g parmesan cheese\nSalt and pepper to taste',
      'Vegetable Soup\n2 carrots\n3 potatoes\n1 onion\n4 cups vegetable broth\n2 cups spinach\nOlive oil, salt, pepper',
      'Chocolate Cake\n2 cups flour\n1 cup sugar\n3/4 cup cocoa powder\n2 eggs\n1 cup milk\n1 tsp vanilla extract\n1 tsp baking powder',
      'Caesar Salad\n1 romaine lettuce\n1/2 cup croutons\n1/4 cup parmesan\n2 tbsp caesar dressing\nBlack pepper to taste',
      'Tomato Risotto\n300g arborio rice\n400g tomatoes\n1 onion\n4 cups chicken broth\n100g parmesan\n2 tbsp olive oil',
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
