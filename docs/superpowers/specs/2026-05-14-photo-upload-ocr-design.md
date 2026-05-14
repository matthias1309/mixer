# Design Spec: Foto-Upload & OCR
**Date**: 2026-05-14  
**Status**: Draft  
**Sub-Project**: Phase 2 - Nutrition Features (Sub-Project 2 of 4)

---

## 1. Overview

**Goal**: Enable users to upload a photo of a recipe and automatically extract text to create a recipe.

**Scope**:
- Photo upload interface (frontend)
- File storage (local filesystem)
- OCR text extraction (Tesseract local)
- Intelligent parsing of extracted text
- Hybrid workflow: Auto-parse + Manual review/correction
- Recipe creation from parsed ingredients

**Dependencies**:
- Sub-Project 1 (Nutrition Database) must be complete for nutrient calculation

**Not in Scope**:
- Image editing/cropping
- Multiple photos per recipe
- Cloud storage
- Advanced ML for ingredient recognition

---

## 2. Requirements

### 2.1 Functional Requirements

**FR1: Photo Upload**
- Users can upload image file (JPG, PNG)
- File size limit: 5MB
- File validation (image type only)

**FR2: OCR Text Extraction**
- Extract text from uploaded image using Tesseract
- Support common recipe formats (ingredient lists, instructions)
- Return raw extracted text

**FR3: Intelligent Parsing**
- Attempt to parse extracted text into:
  - Ingredient name
  - Quantity/amount
  - Unit (g, ml, Stück, EL, etc.)
- Match ingredients to database (Sub-Project 1)
- Flag unrecognized ingredients for manual review

**FR4: Manual Review & Correction**
- User sees parsed ingredients with confidence levels
- User can:
  - Confirm/accept parsed ingredient
  - Correct ingredient name
  - Adjust quantity/unit
  - Remove unrecognized ingredients
  - Add missing ingredients

**FR5: Recipe Creation**
- After user review, create recipe with:
  - Ingredients from parsed + manual corrections
  - Auto-calculated nutrients (from Sub-Project 1)
  - Recipe name (optional, auto-generated from filename or manual)

### 2.2 Non-Functional Requirements

**NFR1: Performance**
- Photo upload: < 2 seconds
- OCR processing: < 5 seconds for typical recipe photo
- Parsing: < 1 second
- Total flow: < 10 seconds from upload to review screen

**NFR2: File Handling**
- Safe file upload (no code injection)
- Secure filename handling
- Cleanup: Delete original photo after successful recipe creation (optional)

**NFR3: User Experience**
- Clear feedback at each step (uploading, processing, reviewing)
- Error messages for upload failures
- Success feedback when recipe created

---

## 3. Architecture

### 3.1 Tech Stack

- **Tesseract**: Local OCR engine
  - No external API calls
  - Runs on Node.js via `tesseract.js` library
  - Can run on RPi (ARM support)

- **File Storage**: Local filesystem
  - Location: `.data/uploads/recipes/`
  - Organized by user + timestamp
  - Safe filename handling (sanitize)

- **Parsing**: Custom regex + fuzzy matching
  - Match extracted text to ingredient database
  - Extract amounts using regex patterns
  - Confidence scoring for matches

---

## 3.2 File Structure

```
src/
├── lib/
│   └── ocr/
│       ├── tesseract.ts       # Tesseract wrapper
│       ├── parser.ts          # Text → ingredients parser
│       ├── matcher.ts         # Match to database
│       └── types.ts           # OCR-related types
├── api/
│   └── recipes/
│       ├── ocr/
│       │   └── route.ts       # POST /api/recipes/ocr
│       └── ocr/
│           └── [uploadId]/
│               └── route.ts   # GET /api/recipes/ocr/:uploadId (review)
├── components/
│   └── recipe/
│       ├── PhotoUploadForm.tsx
│       ├── OcrReview.tsx
│       └── OcrLoading.tsx
├── __tests__/
│   ├── unit/
│   │   └── ocr/
│   │       ├── parser.test.ts
│   │       └── matcher.test.ts
│   └── integration/
│       └── ocr/
│           └── ocr-api.test.ts
└── config/
    └── upload.ts              # Upload config (size, types, path)
```

---

## 4. Data Flow

### 4.1 Upload & Processing Flow

```
User selects photo
    ↓
POST /api/recipes/ocr { file }
    ↓
1. Validate file (type, size)
2. Save to .data/uploads/recipes/{userId}/{timestamp}/
3. Run Tesseract OCR (async)
4. Parse text → ingredients
5. Store result in memory/session with uploadId
    ↓
Return: { uploadId, status: "processing" }
    ↓
Frontend polls GET /api/recipes/ocr/:uploadId
    ↓
OCR complete → return parsed ingredients + confidence
    ↓
Show OcrReview component (user corrects)
```

### 4.2 Review & Confirmation Flow

```
User sees parsed ingredients:
- "2 Äpfel" (confidence: 95%) ✓
- "200ml ???" (confidence: 30%) ⚠️  <- Unrecognized
- "Salz" (confidence: 85%) ✓
    ↓
User can:
- Accept/confirm
- Edit (change "2 Äpfel" → "3 Äpfel")
- Remove (delete "200ml ???")
- Add (add missing ingredient)
    ↓
Click "Create Recipe"
    ↓
POST /api/recipes { ingredients, name }
    ↓
Backend:
1. Validate ingredients against database
2. Calculate nutrients (Sub-Project 1)
3. Create recipe
4. Delete uploaded photo
    ↓
Redirect to recipe detail page
```

---

## 5. API Specification

### 5.1 POST /api/recipes/ocr

**Purpose**: Upload photo and start OCR processing

**Request**:
```
Content-Type: multipart/form-data
Body:
- file: binary image
- recipe_name: optional string
```

**Response**:
```json
{
  "uploadId": "uuid-12345",
  "status": "processing",
  "estimatedTime": 5
}
```

### 5.2 GET /api/recipes/ocr/:uploadId

**Purpose**: Poll for OCR results

**Response (while processing)**:
```json
{
  "status": "processing",
  "progress": 60
}
```

**Response (complete)**:
```json
{
  "status": "complete",
  "ingredients": [
    {
      "raw_text": "2 Äpfel",
      "parsed": {
        "name": "Apfel",
        "amount": 2,
        "unit": "Stück",
        "ingredient_id": 42
      },
      "confidence": 0.95,
      "matched": true
    },
    {
      "raw_text": "200ml unbekannt",
      "parsed": {
        "name": null,
        "amount": 200,
        "unit": "ml",
        "ingredient_id": null
      },
      "confidence": 0.30,
      "matched": false
    }
  ],
  "raw_text": "2 Äpfel\n200ml unbekannt\nSalz"
}
```

### 5.3 PUT /api/recipes/ocr/:uploadId/confirm

**Purpose**: User confirms and corrects parsed ingredients, creates recipe

**Request**:
```json
{
  "ingredients": [
    {
      "ingredient_id": 42,
      "amount": 2,
      "unit": "Stück"
    },
    {
      "ingredient_id": 105,
      "amount": 1,
      "unit": "Teelöffel"
    }
  ],
  "name": "Apfel Salat"
}
```

**Response**:
```json
{
  "recipe_id": 99,
  "name": "Apfel Salat",
  "ingredients_count": 2,
  "message": "Recipe created successfully"
}
```

---

## 6. Implementation Details

### 6.1 Photo Upload & Storage

**Validation** (src/lib/ocr/upload.ts):
```typescript
const UPLOAD_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024,  // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png'],
  UPLOAD_DIR: '.data/uploads/recipes'
};

function validateFile(file: File): boolean
function sanitizeFilename(name: string): string
function getStoragePath(userId: string): string
```

**Storage Path**:
```
.data/uploads/recipes/
  └── user-123/
      └── 2026-05-14T10-30-45-123/
          ├── original.jpg
          └── ocr-result.json
```

### 6.2 OCR Processing (Tesseract)

**Wrapper** (src/lib/ocr/tesseract.ts):
```typescript
import Tesseract from 'tesseract.js';

async function extractTextFromImage(
  imagePath: string
): Promise<string>

// Uses tesseract.js for Node.js
// Language: German ('deu') + English ('eng')
// Returns raw extracted text
```

### 6.3 Ingredient Parsing

**Parser** (src/lib/ocr/parser.ts):
```typescript
interface ParsedIngredient {
  raw_text: string;
  name: string | null;
  amount: number | null;
  unit: string | null;
  confidence: number;
}

async function parseIngredientsFromText(
  text: string,
  ingredients: IngredientDatabase
): Promise<ParsedIngredient[]>
```

**Parsing Strategy**:
1. Split text by lines
2. For each line:
   - Extract number + unit using regex: `(\d+(?:\.\d+)?)\s*(g|ml|EL|Stück|...)?`
   - Extract ingredient name (remaining text)
   - Fuzzy match name to database (using Levenshtein distance or similar)
   - Calculate confidence (0.0-1.0)

**Confidence Scoring**:
- Exact match (name): 1.0
- Fuzzy match (>90% similarity): 0.85
- Fuzzy match (>70% similarity): 0.65
- No match: 0.0

### 6.4 Ingredient Matching

**Matcher** (src/lib/ocr/matcher.ts):
```typescript
function findBestMatch(
  extractedName: string,
  database: Ingredient[]
): { ingredient: Ingredient | null, confidence: number }

// Uses fuzzy string matching
// Handles synonyms (e.g., "Tomate" = "Tomates")
```

---

## 7. User Interface Components

### 7.1 PhotoUploadForm.tsx

- Drag-and-drop zone for photo
- File input button (fallback)
- File validation error messages
- Upload progress indicator
- Loading state with spinner

### 7.2 OcrReview.tsx

- Display parsed ingredients in table/list
- For each ingredient:
  - Show raw extracted text
  - Show parsed result (name, amount, unit)
  - Confidence indicator (green/yellow/red)
  - Edit button
  - Delete button (for unrecognized)
- "Add ingredient" button (manual add from database)
- "Create recipe" button (submit)
- Loading/error states

### 7.3 OcrLoading.tsx

- Progress indicator (processing, extracting, parsing)
- Estimated time remaining
- Cancel button (optional)

---

## 8. Error Handling

**Upload Errors**:
- File too large: "Photo must be < 5MB"
- Wrong file type: "Please upload JPG or PNG"
- Upload failed: "Upload failed. Please try again"

**OCR Errors**:
- No text found: "Could not read text from photo. Please try another."
- Tesseract error: "Text extraction failed. Please try again"

**Parsing Errors**:
- All ingredients unrecognized: "Could not identify ingredients. Please add manually."
- Low confidence overall: "Low confidence in ingredient detection. Please review carefully."

---

## 9. Testing Strategy

### 9.1 Unit Tests

**File**: `src/__tests__/unit/ocr/parser.test.ts`

Test cases:
- Parse simple ingredient line: "2 Äpfel"
- Parse with unit: "200ml Milch"
- Parse without amount: "Salz" (to taste)
- Multiple ingredients from text block
- Edge cases (lowercase, extra spaces, special chars)
- Non-German ingredients (fallback to English)

**File**: `src/__tests__/unit/ocr/matcher.test.ts`

Test cases:
- Exact match: "Apfel" → "Apfel"
- Fuzzy match: "Äpfel" → "Apfel"
- Synonyms: "Tomatoe" → "Tomate"
- No match: "xyz123" → null
- Confidence scoring accuracy

### 9.2 Integration Tests

**File**: `src/__tests__/integration/ocr/ocr-api.test.ts`

Test cases:
- POST /api/recipes/ocr with valid image
- GET /api/recipes/ocr/:uploadId polling (processing state)
- GET /api/recipes/ocr/:uploadId with results
- PUT /api/recipes/ocr/:uploadId/confirm creates recipe
- File cleanup after recipe creation
- File upload size validation
- File upload type validation
- Concurrent uploads from different users

### 9.3 Manual Testing

- Test with various recipe photos (clear, blurry, handwritten)
- Test with different languages (German recipes, English recipes)
- Test with recipes with special ingredients
- Test review & correction workflow
- Test error cases (bad photo, corrupted file)

---

## 10. Performance Considerations

**Tesseract on RPi**:
- First load: ~2-3 seconds (model download/cache)
- Subsequent runs: ~3-5 seconds per image
- Consider async processing (don't block UI)

**File Storage**:
- Cleanup old uploads: Scheduled job (daily) to delete 7+ day old uploads
- Monitor storage usage on RPi

**Frontend Polling**:
- Poll GET /api/recipes/ocr/:uploadId every 1 second (while processing)
- Timeout after 15 seconds (OCR takes too long)

---

## 11. Future Enhancements (Not in Scope)

- Multiple photos per recipe
- Image cropping/rotation before OCR
- Ingredient synonyms database (expandable)
- ML-based amount extraction (better than regex)
- Recipe name extraction from photo
- Handwritten recipe support
- Batch OCR processing

---

## 12. Constraints & Assumptions

**Constraints**:
- Single photo per recipe
- Tesseract language: German + English
- File size limit: 5MB
- No cloud storage (local filesystem only)

**Assumptions**:
- Photos are reasonably clear (printed/digital recipes)
- Users can correct parsing errors
- Ingredient names are recognizable (in database)
- File upload happens over local network (RPi)

---

## 13. Dependencies & Integration

**Depends On**:
- Sub-Project 1 (Nutrition Database): For ingredient validation + nutrient calculation
- User authentication (from MVP)
- Recipe creation API (from MVP)

**Integrates With**:
- Recipe creation flow
- Ingredient database
- Nutrient calculation

---

## 14. Definition of Done

✅ All items must be complete:

- [ ] Tesseract.js installed and configured
- [ ] File upload endpoint implemented (POST /api/recipes/ocr)
- [ ] OCR processing async + polling endpoint (GET /api/recipes/ocr/:uploadId)
- [ ] Text parsing logic implemented (parser.ts)
- [ ] Ingredient matching logic implemented (matcher.ts)
- [ ] Manual review/confirmation endpoint (PUT /api/recipes/ocr/:uploadId/confirm)
- [ ] PhotoUploadForm component built
- [ ] OcrReview component built
- [ ] OcrLoading component built
- [ ] File cleanup after recipe creation
- [ ] Validation (file type, size)
- [ ] Error handling + user messages
- [ ] Unit tests (parser, matcher) with 90%+ coverage
- [ ] Integration tests (API endpoints) with 80%+ coverage
- [ ] Manual testing with real recipe photos
- [ ] Performance verified (< 10 seconds total flow)
- [ ] No console errors
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm run test:coverage`)
- [ ] Code reviewed and approved

---

## 15. Acceptance Criteria

When complete, users should be able to:
1. ✅ Upload a recipe photo
2. ✅ See automatically extracted and parsed ingredients
3. ✅ Review and correct parsed ingredients
4. ✅ Create a recipe from the parsed ingredients
5. ✅ Recipe automatically has calculated nutrients
6. ✅ Photos cleaned up after recipe creation
7. ✅ All operations complete in < 10 seconds

---

**Document Status**: Ready for user review
**Next Step**: User approval → Writing implementation plan with Sub-Projects 3 & 4
