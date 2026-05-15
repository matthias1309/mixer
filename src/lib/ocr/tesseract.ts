import Tesseract from 'tesseract.js';
import { TESSERACT_CONFIG } from './constants';

let worker: Tesseract.Worker | null = null;

async function getWorker(): Promise<Tesseract.Worker> {
  if (!worker) {
    worker = await Tesseract.createWorker({
      logger: (m) => {
        if (m.status === 'recognizing') {
          console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`);
        }
      },
    });

    await worker.loadLanguage(TESSERACT_CONFIG.LANGUAGES);
    await worker.initialize(TESSERACT_CONFIG.LANGUAGES);
  }

  return worker;
}

export async function extractTextFromImage(
  imageBuffer: Buffer | Uint8Array
): Promise<string> {
  try {
    const worker = await getWorker();

    const {
      data: { text },
    } = await worker.recognize(imageBuffer);

    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

export async function terminateWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
