import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

import { RecipeModelAsync } from '@/lib/db/models/recipe-async';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { HTTP_STATUS } from '@/lib/constants';
import { withDatabase } from '@/lib/api/withDatabase';
import { getValidationError } from '@/config/upload';
import {
  saveRecipeImage,
  getRecipeImagePath,
  deleteRecipeImage,
  contentTypeFor,
} from '@/lib/recipes/image-storage';

type Params = Promise<{ id: string }>;

function parseRecipeId(raw: string): number | null {
  const id = parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
}

// POST /api/recipes/[id]/image - Upload or replace a recipe photo (owner only)
async function handlePOST(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const recipeId = parseRecipeId(params.id);
    if (recipeId === null) {
      return NextResponse.json(
        { error: 'Invalid recipe ID' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Must be logged in to upload a recipe photo' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const recipe = await RecipeModelAsync.findById(recipeId);
    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    if (recipe.creator_id !== parseInt(auth.userId, 10)) {
      return NextResponse.json(
        { error: 'You can only change photos of recipes you created' },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const validationError = getValidationError(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const previousImage = recipe.image_path;
    const fileName = await saveRecipeImage(recipeId, file);
    await RecipeModelAsync.setImage(recipeId, fileName);

    // Replacing a photo: drop the old file so uploads don't accumulate.
    if (previousImage && previousImage !== fileName) {
      deleteRecipeImage(previousImage);
    }

    let response = NextResponse.json({ imagePath: fileName }, { status: HTTP_STATUS.OK });
    response = setTokenCookie(response, auth.newToken);
    return response;
  } catch (error) {
    console.error('Upload recipe image error:', error);
    return NextResponse.json(
      { error: 'Failed to upload recipe photo' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// GET /api/recipes/[id]/image - Serve a recipe photo (public)
async function handleGET(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const recipeId = parseRecipeId(params.id);
    if (recipeId === null) {
      return NextResponse.json(
        { error: 'Invalid recipe ID' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const recipe = await RecipeModelAsync.findById(recipeId);
    if (!recipe || !recipe.image_path) {
      return NextResponse.json(
        { error: 'Recipe photo not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    const filePath = getRecipeImagePath(recipe.image_path);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Recipe photo not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    const bytes = fs.readFileSync(filePath);
    return new NextResponse(new Uint8Array(bytes), {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': contentTypeFor(recipe.image_path),
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    console.error('Get recipe image error:', error);
    return NextResponse.json(
      { error: 'Failed to load recipe photo' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export const POST = withDatabase(handlePOST);
export const GET = withDatabase(handleGET);
