export interface ParsedIngredient {
  raw_text: string;
  name: string | null;
  amount: number | null;
  unit: string | null;
  ingredient_id: number | null;
  confidence: number; // 0-1
  matched: boolean;
}

export interface OcrResult {
  uploadId: string;
  status: 'processing' | 'complete' | 'error';
  raw_text?: string;
  ingredients?: ParsedIngredient[];
  error?: string;
  processing_time?: number;
}

export interface OcrReviewRequest {
  uploadId: string;
  ingredients: Array<{
    ingredient_id: number;
    amount: number;
    unit: string;
  }>;
  recipe_name: string;
}

export interface AmountUnit {
  amount: number;
  unit: string;
}

export interface IngredientMatch {
  ingredient_id: number;
  name: string;
  confidence: number;
}
