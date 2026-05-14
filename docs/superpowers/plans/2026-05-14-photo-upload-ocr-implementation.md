# Photo Upload & OCR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to upload recipe photos, extract text via OCR, and create recipes from parsed ingredients.

**Architecture:** Multi-step workflow: upload → OCR processing → intelligent parsing → manual review → recipe creation. Uses Tesseract for local OCR (no external APIs). Hybrid approach: auto-parsing + user corrections.

**Tech Stack:** TypeScript, Next.js, Tesseract.js, React, Jest, multipart form handling

**Dependencies:** Sub-Project 1 (Nutrition Database) - for ingredient validation and nutrient calculation

**Blocking Requirement**: Plan 1 (Nutrition Database) must be complete before starting this plan

---

## File Structure

**New files to create:**
```
src/
├── lib/ocr/
│   ├── tesseract.ts           # Tesseract wrapper
│   ├── parser.ts              # Text parsing logic
│   ├── matcher.ts             # Ingredient matching
│   ├── types.ts               # OCR types
│   └── constants.ts           # Regex patterns, constants
├── api/recipes/
│   └── ocr/
│       ├── route.ts           # POST /api/recipes/ocr (upload)
│       └── [uploadId]/
│           └── route.ts       # GET /api/recipes/ocr/:uploadId (status)
├── components/recipe/
│   ├── PhotoUploadForm.tsx    # Upload UI
│   ├── OcrReview.tsx          # Review/correction UI
│   └── OcrLoading.tsx         # Loading state
├── config/
│   └── upload.ts              # Upload configuration
└── __tests__/
    ├── unit/ocr/
    │   ├── parser.test.ts
    │   ├── matcher.test.ts
    │   └── types.test.ts
    └── integration/ocr/
        └── ocr-api.test.ts
```

**Modify existing files:**
- `src/types/recipe.ts` - Add OcrResult, ParsedIngredient types
- `package.json` - Add tesseract.js dependency

---

## Tasks

### Task 1: Install Tesseract.js & Configure Upload

**Files:**
- Modify: `package.json`
- Create: `src/config/upload.ts`

- [ ] **Step 1: Add tesseract.js to dependencies**

```bash
npm install tesseract.js
```

Verify it's added to `package.json`:
```json
{
  "dependencies": {
    "tesseract.js": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create upload configuration**

```typescript
// src/config/upload.ts

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'],
  UPLOAD_DIR: '.data/uploads/recipes',
  TEMP_DIR: '.data/uploads/temp',
} as const;

export function isValidFile(file: File): boolean {
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return false;
  }
  if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
    return false;
  }
  return true;
}

export function getValidationError(file: File): string | null {
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return 'File must be smaller than 5MB';
  }
  if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Only JPG and PNG files are supported';
  }
  return null;
}

export function sanitizeFilename(filename: string): string {
  // Remove special characters, keep only alphanumeric, dash, underscore
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Max filename length
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json src/config/upload.ts
git commit -m "feat: add tesseract.js dependency and upload configuration"
```

---

### Task 2: Create OCR Type Definitions

**Files:**
- Create: `src/lib/ocr/types.ts`
- Modify: `src/types/recipe.ts`

- [ ] **Step 1: Create OCR types**

```typescript
// src/lib/ocr/types.ts

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
```

- [ ] **Step 2: Extend recipe types**

Add to `src/types/recipe.ts`:

```typescript
import { ParsedIngredient, OcrResult } from '@/lib/ocr/types';

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  amount: number;
  unit: string;
}

export interface CreateRecipeFromOcrRequest {
  uploadId: string;
  ingredients: Array<{
    ingredient_id: number;
    amount: number;
    unit: string;
  }>;
  name: string;
  portions?: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ocr/types.ts src/types/recipe.ts
git commit -m "feat: add OCR type definitions"
```

---

### Task 3: Create OCR Constants & Patterns

**Files:**
- Create: `src/lib/ocr/constants.ts`

- [ ] **Step 1: Create OCR constants**

```typescript
// src/lib/ocr/constants.ts

// Regex patterns for parsing
export const AMOUNT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(g|ml|kg|l|mg|EL|TL|Stück|Tasse)?/i;

// Common measurement units (German + English)
export const MEASUREMENT_UNITS = [
  'g',     // grams
  'ml',    // milliliters
  'kg',    // kilograms
  'l',     // liters
  'mg',    // milligrams
  'EL',    // Esslöffel (tablespoon)
  'TL',    // Teelöffel (teaspoon)
  'Stück', // piece
  'Tasse', // cup
] as const;

// Ingredient synonyms mapping
export const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  'Hähnchen': ['chicken', 'huhn', 'poulet'],
  'Tomate': ['tomato', 'tomates'],
  'Zwiebel': ['onion', 'zwiebeln'],
  'Knoblauch': ['garlic', 'knoblauch'],
  'Salz': ['salt', 'sea salt'],
  // Add more as needed
};

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  EXACT_MATCH: 1.0,
  HIGH: 0.85,
  MEDIUM: 0.7,
  LOW: 0.5,
  UNKNOWN: 0.0,
} as const;

// Tesseract configuration
export const TESSERACT_CONFIG = {
  LANGUAGES: 'deu+eng', // German + English
  TIMEOUT: 10000, // 10 seconds
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ocr/constants.ts
git commit -m "feat: add OCR constants and regex patterns"
```

---

### Task 4: Create Ingredient Matcher

**Files:**
- Create: `src/lib/ocr/matcher.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/unit/ocr/matcher.test.ts

import { findBestMatch } from '@/lib/ocr/matcher';
import { Ingredient } from '@/lib/nutrition/types';

describe('Ingredient Matcher', () => {
  const mockIngredients: Ingredient[] = [
    {
      id: 1,
      name: 'Apfel',
      category: 'Obst',
      base_unit: 'g',
      base_size: 100,
      kcal: 52,
      sugar: 10.4,
      fat: 0.3,
      protein: 0.3,
      carbohydrates: 13.8,
      fiber: 2.4,
      sodium: 2,
      calcium: 5,
      vitamin_d: 0,
      magnesium: 5,
      vitamin_b6: 0.04,
      vitamin_b12: 0,
      vitamin_e: 0.18,
      zinc: 0.04,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      name: 'Tomate',
      category: 'Gemüse',
      base_unit: 'g',
      base_size: 100,
      kcal: 18,
      sugar: 2.6,
      fat: 0.2,
      protein: 0.9,
      carbohydrates: 3.9,
      fiber: 1.2,
      sodium: 5,
      calcium: 10,
      vitamin_d: 0,
      magnesium: 11,
      vitamin_b6: 0.08,
      vitamin_b12: 0,
      vitamin_e: 0.54,
      zinc: 0.17,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  it('finds exact match', () => {
    const result = findBestMatch('Apfel', mockIngredients);
    expect(result.ingredient?.id).toBe(1);
    expect(result.confidence).toBe(1.0);
  });

  it('finds fuzzy match', () => {
    const result = findBestMatch('apfel', mockIngredients); // lowercase
    expect(result.ingredient?.id).toBe(1);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('returns null for no match', () => {
    const result = findBestMatch('xyz123', mockIngredients);
    expect(result.ingredient).toBeNull();
    expect(result.confidence).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/__tests__/unit/ocr/matcher.test.ts -v
```

Expected: FAIL - "findBestMatch is not defined"

- [ ] **Step 3: Implement matcher**

```typescript
// src/lib/ocr/matcher.ts

import { Ingredient } from '@/lib/nutrition/types';
import { INGREDIENT_SYNONYMS, CONFIDENCE_THRESHOLDS } from './constants';

interface MatchResult {
  ingredient: Ingredient | null;
  confidence: number;
}

/**
 * Calculate Levenshtein distance between two strings
 * Lower distance = better match
 */
function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  const dp: number[][] = Array(aLower.length + 1)
    .fill(null)
    .map(() => Array(bLower.length + 1).fill(0));

  for (let i = 0; i <= aLower.length; i++) dp[i][0] = i;
  for (let j = 0; j <= bLower.length; j++) dp[0][j] = j;

  for (let i = 1; i <= aLower.length; i++) {
    for (let j = 1; j <= bLower.length; j++) {
      if (aLower[i - 1] === bLower[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[aLower.length][bLower.length];
}

/**
 * Calculate similarity as percentage (0-1)
 */
function calculateSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

/**
 * Find best matching ingredient from database
 */
export function findBestMatch(
  extractedName: string,
  ingredients: Ingredient[]
): MatchResult {
  let bestMatch: Ingredient | null = null;
  let bestConfidence = 0;

  for (const ingredient of ingredients) {
    // Check exact match
    if (ingredient.name.toLowerCase() === extractedName.toLowerCase()) {
      return {
        ingredient,
        confidence: CONFIDENCE_THRESHOLDS.EXACT_MATCH,
      };
    }

    // Check synonyms
    if (INGREDIENT_SYNONYMS[ingredient.name]) {
      if (INGREDIENT_SYNONYMS[ingredient.name].some(
        syn => syn.toLowerCase() === extractedName.toLowerCase()
      )) {
        return {
          ingredient,
          confidence: CONFIDENCE_THRESHOLDS.HIGH,
        };
      }
    }

    // Check fuzzy match
    const similarity = calculateSimilarity(extractedName, ingredient.name);
    if (similarity > bestConfidence && similarity > CONFIDENCE_THRESHOLDS.LOW) {
      bestConfidence = similarity;
      bestMatch = ingredient;
    }
  }

  return {
    ingredient: bestMatch,
    confidence: bestConfidence,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/__tests__/unit/ocr/matcher.test.ts -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ocr/matcher.ts src/__tests__/unit/ocr/matcher.test.ts
git commit -m "feat: implement ingredient fuzzy matching with Levenshtein distance"
```

---

### Task 5: Create Text Parser

**Files:**
- Create: `src/lib/ocr/parser.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/unit/ocr/parser.test.ts

import { parseIngredientsFromText } from '@/lib/ocr/parser';
import { Ingredient } from '@/lib/nutrition/types';

describe('Ingredient Parser', () => {
  const mockIngredients: Ingredient[] = [
    {
      id: 1,
      name: 'Apfel',
      // ... other fields
    } as Ingredient,
  ];

  it('parses simple ingredient line', () => {
    const text = '2 Äpfel';
    const results = parseIngredientsFromText(text, mockIngredients);

    expect(results.length).toBe(1);
    expect(results[0].amount).toBe(2);
    expect(results[0].unit).toBe('Stück');
    expect(results[0].name).toBe('Apfel');
  });

  it('parses ingredient with unit', () => {
    const text = '200 ml Milch';
    const results = parseIngredientsFromText(text, mockIngredients);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].amount).toBe(200);
    expect(results[0].unit).toBe('ml');
  });

  it('handles multiple lines', () => {
    const text = '2 Äpfel\n200 ml Milch\nSalz';
    const results = parseIngredientsFromText(text, mockIngredients);

    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/__tests__/unit/ocr/parser.test.ts -v
```

Expected: FAIL

- [ ] **Step 3: Implement parser**

```typescript
// src/lib/ocr/parser.ts

import { Ingredient, ParsedIngredient } from '@/lib/nutrition/types';
import { AMOUNT_PATTERN, MEASUREMENT_UNITS } from './constants';
import { findBestMatch } from './matcher';

export function parseIngredientsFromText(
  text: string,
  ingredients: Ingredient[]
): ParsedIngredient[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const results: ParsedIngredient[] = [];

  for (const line of lines) {
    const parsed = parseIngredientLine(line, ingredients);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

function parseIngredientLine(
  line: string,
  ingredients: Ingredient[]
): ParsedIngredient | null {
  const trimmed = line.trim();

  // Try to extract amount and unit
  const amountMatch = trimmed.match(AMOUNT_PATTERN);
  let amount: number | null = null;
  let unit: string | null = null;
  let remainingText = trimmed;

  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(',', '.'));
    if (amountMatch[2]) {
      unit = amountMatch[2];
    }
    remainingText = trimmed.replace(amountMatch[0], '').trim();
  }

  // Extract ingredient name
  const ingredientName = remainingText.trim();

  if (!ingredientName) {
    return null;
  }

  // Find matching ingredient
  const match = findBestMatch(ingredientName, ingredients);

  // Determine unit (default to piece if no unit found)
  if (!unit && amount && match.ingredient) {
    unit = 'Stück';
  }

  return {
    raw_text: trimmed,
    name: match.ingredient?.name || ingredientName,
    amount,
    unit,
    ingredient_id: match.ingredient?.id || null,
    confidence: match.confidence,
    matched: match.ingredient !== null,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/__tests__/unit/ocr/parser.test.ts -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ocr/parser.ts src/__tests__/unit/ocr/parser.test.ts
git commit -m "feat: implement OCR text parsing with amount/unit extraction"
```

---

### Task 6: Create Tesseract Wrapper

**Files:**
- Create: `src/lib/ocr/tesseract.ts`

- [ ] **Step 1: Create Tesseract wrapper**

```typescript
// src/lib/ocr/tesseract.ts

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
  imagePath: string
): Promise<string> {
  try {
    const worker = await getWorker();

    const {
      data: { text },
    } = await worker.recognize(imagePath);

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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ocr/tesseract.ts
git commit -m "feat: add Tesseract OCR wrapper with worker management"
```

---

### Task 7: Create Upload API Endpoint

**Files:**
- Create: `src/api/recipes/ocr/route.ts`

- [ ] **Step 1: Write failing test**

```typescript
// Add to src/__tests__/integration/ocr/ocr-api.test.ts

import { POST as uploadPhoto } from '@/api/recipes/ocr/route';

describe('POST /api/recipes/ocr', () => {
  it('accepts photo upload', async () => {
    const formData = new FormData();
    formData.append('file', new File(['test'], 'recipe.jpg', { type: 'image/jpeg' }));

    const request = new Request('http://localhost/api/recipes/ocr', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer test-token',
      },
    });

    const response = await uploadPhoto(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.uploadId).toBeDefined();
    expect(data.status).toBe('processing');
  });

  it('rejects file > 5MB', async () => {
    const largeFile = new File(
      [new ArrayBuffer(6 * 1024 * 1024)],
      'large.jpg'
    );
    const formData = new FormData();
    formData.append('file', largeFile);

    const request = new Request('http://localhost/api/recipes/ocr', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadPhoto(request);
    expect(response.status).toBe(400);
  });

  it('rejects non-image files', async () => {
    const formData = new FormData();
    formData.append('file', new File(['test'], 'recipe.txt', { type: 'text/plain' }));

    const request = new Request('http://localhost/api/recipes/ocr', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadPhoto(request);
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/__tests__/integration/ocr/ocr-api.test.ts::POST -v
```

Expected: FAIL

- [ ] **Step 3: Create upload endpoint**

```typescript
// src/api/recipes/ocr/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getValidationError, UPLOAD_CONFIG, sanitizeFilename } from '@/config/upload';
import { extractTextFromImage } from '@/lib/ocr/tesseract';
import { parseIngredientsFromText } from '@/lib/ocr/parser';
import { getDatabase } from '@/lib/db/client';

// In-memory storage for OCR results (TODO: use Redis or DB in production)
const ocrCache = new Map<string, {
  status: string;
  raw_text?: string;
  ingredients?: any[];
  error?: string;
}>();

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validationError = getValidationError(file);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Save file
    const uploadId = randomUUID();
    const uploadDir = join(UPLOAD_CONFIG.UPLOAD_DIR, user.userId.toString(), uploadId);
    await mkdir(uploadDir, { recursive: true });

    const filename = sanitizeFilename(file.name);
    const filepath = join(uploadDir, filename);

    const buffer = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));

    // Start OCR processing (async)
    ocrCache.set(uploadId, { status: 'processing' });

    processOcrAsync(uploadId, filepath, user.userId).catch(err => {
      ocrCache.set(uploadId, {
        status: 'error',
        error: 'OCR processing failed',
      });
    });

    return NextResponse.json({
      status: 200,
      uploadId,
      status: 'processing',
      estimatedTime: 5,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

async function processOcrAsync(
  uploadId: string,
  filepath: string,
  userId: number
): Promise<void> {
  try {
    // Extract text
    const rawText = await extractTextFromImage(filepath);

    // Get ingredients from database
    const db = await getDatabase();
    const ingredients = await db.all('SELECT * FROM ingredients');

    // Parse ingredients
    const parsed = parseIngredientsFromText(rawText, ingredients);

    // Store result
    ocrCache.set(uploadId, {
      status: 'complete',
      raw_text: rawText,
      ingredients: parsed,
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    ocrCache.set(uploadId, {
      status: 'error',
      error: 'Failed to process image',
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/__tests__/integration/ocr/ocr-api.test.ts::POST -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/api/recipes/ocr/route.ts src/__tests__/integration/ocr/ocr-api.test.ts
git commit -m "feat: add POST /api/recipes/ocr upload endpoint with file validation"
```

---

### Task 8: Create Status Polling Endpoint

**Files:**
- Create: `src/api/recipes/ocr/[uploadId]/route.ts`

- [ ] **Step 1: Write failing test**

```typescript
// Add to src/__tests__/integration/ocr/ocr-api.test.ts

import { GET as getOcrStatus } from '@/api/recipes/ocr/[uploadId]/route';

describe('GET /api/recipes/ocr/:uploadId', () => {
  it('returns processing status while OCR is running', async () => {
    const request = new Request(
      'http://localhost/api/recipes/ocr/test-upload-id'
    );

    const response = await getOcrStatus(request, {
      params: { uploadId: 'test-upload-id' },
    });

    const data = await response.json();
    expect([200, 202].includes(response.status)).toBe(true);
    expect(['processing', 'complete', 'error'].includes(data.status)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/__tests__/integration/ocr/ocr-api.test.ts::GET -v
```

Expected: FAIL

- [ ] **Step 3: Create status endpoint**

```typescript
// src/api/recipes/ocr/[uploadId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

// Reference to cache from parent route
import { ocrCache } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  try {
    // Verify auth
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uploadId = params.uploadId;
    const result = ocrCache.get(uploadId);

    if (!result) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    const statusCode = result.status === 'processing' ? 202 : 200;

    return NextResponse.json({
      status: statusCode,
      data: result,
    }, { status: statusCode });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/__tests__/integration/ocr/ocr-api.test.ts::GET -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/api/recipes/ocr/[uploadId]/route.ts
git commit -m "feat: add GET /api/recipes/ocr/:uploadId polling endpoint"
```

---

### Task 9: Create React Components - Upload Form

**Files:**
- Create: `src/components/recipe/PhotoUploadForm.tsx`

- [ ] **Step 1: Create upload form component**

```typescript
// src/components/recipe/PhotoUploadForm.tsx

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
        const response = await fetch(`/api/recipes/ocr/${id}`);
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
```

- [ ] **Step 2: Create loading component**

```typescript
// src/components/recipe/OcrLoading.tsx

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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/recipe/PhotoUploadForm.tsx src/components/recipe/OcrLoading.tsx
git commit -m "feat: add PhotoUploadForm and OcrLoading components"
```

---

### Task 10: Create Review Component

**Files:**
- Create: `src/components/recipe/OcrReview.tsx`

- [ ] **Step 1: Create review component**

```typescript
// src/components/recipe/OcrReview.tsx

'use client';

import { useState, useEffect } from 'react';
import { ParsedIngredient } from '@/lib/ocr/types';

interface OcrReviewProps {
  uploadId: string;
  onRecipeCreated?: (recipeId: number) => void;
}

export default function OcrReview({ uploadId, onRecipeCreated }: OcrReviewProps) {
  const [ingredients, setIngredients] = useState<ParsedIngredient[]>([]);
  const [recipeName, setRecipeName] = useState('');
  const [portions, setPortions] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOcrResult();
  }, [uploadId]);

  const fetchOcrResult = async () => {
    try {
      const response = await fetch(`/api/recipes/ocr/${uploadId}`);
      const data = await response.json();

      if (data.data.ingredients) {
        setIngredients(data.data.ingredients);
      }
    } catch (err) {
      setError('Failed to load OCR result');
    }
  };

  const handleCreateRecipe = async () => {
    if (!recipeName.trim()) {
      setError('Please enter a recipe name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recipeName,
          portions: portions,
          ingredients: ingredients
            .filter(ing => ing.ingredient_id !== null)
            .map(ing => ({
              ingredient_id: ing.ingredient_id,
              amount: ing.amount || 1,
              unit: ing.unit || 'Stück',
            })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create recipe');
      }

      const data = await response.json();
      onRecipeCreated?.(data.recipe_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recipe creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ocr-review">
      <h2>Review & Correct Ingredients</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="recipe-name">Recipe Name</label>
        <input
          id="recipe-name"
          type="text"
          value={recipeName}
          onChange={e => setRecipeName(e.target.value)}
          placeholder="e.g., Apfel Salat"
        />
      </div>

      <div className="form-group">
        <label htmlFor="portions">Portions</label>
        <input
          id="portions"
          type="number"
          min="1"
          value={portions}
          onChange={e => setPortions(parseInt(e.target.value))}
        />
      </div>

      <div className="ingredients-list">
        <h3>Ingredients ({ingredients.length})</h3>
        {ingredients.map((ing, idx) => (
          <div key={idx} className={`ingredient-item ${ing.matched ? 'matched' : 'unmatched'}`}>
            <span className="confidence">
              {(ing.confidence * 100).toFixed(0)}%
            </span>
            <span className="name">{ing.name}</span>
            <span className="amount">
              {ing.amount} {ing.unit}
            </span>
            {!ing.matched && <span className="badge">⚠️ Manual review needed</span>}
          </div>
        ))}
      </div>

      <button
        onClick={handleCreateRecipe}
        disabled={loading || ingredients.length === 0}
        className="button primary"
      >
        {loading ? 'Creating...' : 'Create Recipe'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/recipe/OcrReview.tsx
git commit -m "feat: add OcrReview component for ingredient review and correction"
```

---

### Task 11: Run Tests & Coverage

**Files:**
- Test: All OCR tests

- [ ] **Step 1: Run all unit tests**

```bash
npm run test -- src/__tests__/unit/ocr/ -v
```

Expected: All tests PASS

- [ ] **Step 2: Run integration tests**

```bash
npm run test -- src/__tests__/integration/ocr/ -v
```

Expected: All tests PASS

- [ ] **Step 3: Check coverage**

```bash
npm run test:coverage -- src/lib/ocr/
```

Expected: 80%+ coverage

- [ ] **Step 4: Run linter**

```bash
npm run lint -- src/lib/ocr/ src/api/recipes/ocr/
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test: verify OCR module coverage (80%+)"
```

---

### Task 12: Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add API documentation**

Add to `README.md`:

```markdown
### OCR & Recipe Upload Endpoints

**POST /api/recipes/ocr**
- Upload recipe photo
- Auth: Required
- Body: multipart/form-data with `file`
- Response: `{ uploadId, status: "processing" }`

**GET /api/recipes/ocr/:uploadId**
- Poll OCR processing status
- Auth: Required
- Response: `{ status, raw_text?, ingredients?, error? }`
  - Status: "processing", "complete", or "error"
  - Ingredients: Array of ParsedIngredient
```

- [ ] **Step 2: Add usage example**

```markdown
### OCR Workflow Example

1. User uploads recipe photo via POST /api/recipes/ocr
2. Returns uploadId, status: "processing"
3. Frontend polls GET /api/recipes/ocr/:uploadId every second
4. When status = "complete", show OcrReview component
5. User reviews and corrects ingredients
6. Submit to POST /api/recipes to create recipe with nutrients
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add OCR API documentation and workflow example"
```

---

## Checklist Summary

- [ ] Task 1: Tesseract.js installed + upload config
- [ ] Task 2: OCR type definitions
- [ ] Task 3: Constants and regex patterns
- [ ] Task 4: Ingredient matcher with fuzzy matching
- [ ] Task 5: Text parser with amount extraction
- [ ] Task 6: Tesseract wrapper
- [ ] Task 7: POST /api/recipes/ocr upload endpoint
- [ ] Task 8: GET /api/recipes/ocr/:uploadId polling endpoint
- [ ] Task 9: PhotoUploadForm & OcrLoading components
- [ ] Task 10: OcrReview component
- [ ] Task 11: Tests and coverage (80%+)
- [ ] Task 12: Documentation

**Total Effort**: ~12 tasks, 50-70 minutes for experienced developer

---

## Dependencies

- ✅ Requires Sub-Project 1 (Nutrition Database) to be complete
- ✅ Ingredient validation uses Plan 1 database
- ✅ Nutrient calculation uses Plan 1 calculator

**Can start AFTER Plan 1 is approved and implemented**

---

**Plan Status**: Ready for execution  
**Recommended Execution**: Subagent-driven (Task-by-task with review)
