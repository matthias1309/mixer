/** @jest-environment node */
import { POST as POST_IMAGE, GET as GET_IMAGE } from '../../../../app/api/recipes/[id]/image/route';
import { GET as GET_DETAIL } from '../../../../app/api/recipes/[id]/route';
import { UserModel } from '../../../../lib/db/models/user';
import { RecipeModel } from '../../../../lib/db/models/recipe';
import { RecipeModelAsync } from '../../../../lib/db/models/recipe-async';
import { initializeDatabase, closeDatabase } from '../../../../lib/db/init';
import { generateToken } from '../../../../lib/auth/tokenRefresh';
import { getRecipeImagePath } from '../../../../lib/recipes/image-storage';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

// A minimal valid 1x1 PNG (decoded from base64) — enough for an upload.
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

function imageFormData(bytes: Buffer, type: string, name: string): FormData {
  const form = new FormData();
  const file = new File([bytes], name, { type });
  form.set('file', file);
  return form;
}

function imageRequest(recipeId: number, form: FormData, token?: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/recipes/${recipeId}/image`, {
    method: 'POST',
    headers: token ? { cookie: `sessionToken=${token}` } : undefined,
    body: form,
  });
}

describe('Recipe Image API', () => {
  let testDbPath: string;
  let testCounter = 0;
  let user1Id: number;
  let user2Id: number;
  let user1Token: string;
  let user2Token: string;
  const createdImagePaths: string[] = [];

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(__dirname, `../../../../../.data/test-recipe-image-${testCounter}.db`);

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    await initializeDatabase();

    const passwordHash1 = await bcryptjs.hash('TestPassword123', 10);
    const user1 = await UserModel.create('user1@example.com', passwordHash1);
    user1Id = user1.id;
    user1Token = generateToken(String(user1Id), 'user1@example.com');

    const passwordHash2 = await bcryptjs.hash('TestPassword123', 10);
    const user2 = await UserModel.create('user2@example.com', passwordHash2);
    user2Id = user2.id;
    user2Token = generateToken(String(user2Id), 'user2@example.com');
  });

  afterEach(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    while (createdImagePaths.length > 0) {
      const fileName = createdImagePaths.pop()!;
      const filePath = getRecipeImagePath(fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
  });

  // TC-009-01
  test('owner uploads a valid image and it is associated with the recipe', async () => {
    const recipe = RecipeModel.create('Photo Recipe', user1Id);

    const response = await POST_IMAGE(
      imageRequest(recipe.id, imageFormData(PNG_BYTES, 'image/png', 'photo.png'), user1Token),
      { params: Promise.resolve({ id: String(recipe.id) }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.imagePath).toBeTruthy();
    createdImagePaths.push(data.imagePath);

    const stored = await RecipeModelAsync.findById(recipe.id);
    expect(stored?.image_path).toBe(data.imagePath);

    const detail = await GET_DETAIL(
      new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`),
      { params: Promise.resolve({ id: String(recipe.id) }) }
    );
    const detailData = await detail.json();
    expect(detailData.imagePath).toBeTruthy();
  });

  // TC-009-02
  test('uploading a new image replaces the existing one', async () => {
    const recipe = RecipeModel.create('Photo Recipe', user1Id);

    const first = await POST_IMAGE(
      imageRequest(recipe.id, imageFormData(PNG_BYTES, 'image/png', 'first.png'), user1Token),
      { params: Promise.resolve({ id: String(recipe.id) }) }
    );
    const firstData = await first.json();
    createdImagePaths.push(firstData.imagePath);

    const second = await POST_IMAGE(
      imageRequest(recipe.id, imageFormData(PNG_BYTES, 'image/jpeg', 'second.jpg'), user1Token),
      { params: Promise.resolve({ id: String(recipe.id) }) }
    );
    const secondData = await second.json();
    createdImagePaths.push(secondData.imagePath);

    expect(second.status).toBe(200);
    expect(secondData.imagePath).not.toBe(firstData.imagePath);

    const stored = await RecipeModelAsync.findById(recipe.id);
    expect(stored?.image_path).toBe(secondData.imagePath);
  });

  // TC-009-03
  test('non-owner cannot upload an image', async () => {
    const recipe = RecipeModel.create('Photo Recipe', user1Id);

    const response = await POST_IMAGE(
      imageRequest(recipe.id, imageFormData(PNG_BYTES, 'image/png', 'photo.png'), user2Token),
      { params: Promise.resolve({ id: String(recipe.id) }) }
    );

    expect(response.status).toBe(403);
    const stored = await RecipeModelAsync.findById(recipe.id);
    expect(stored?.image_path).toBeFalsy();
  });

  // TC-009-04
  test('unauthenticated upload is rejected', async () => {
    const recipe = RecipeModel.create('Photo Recipe', user1Id);

    const response = await POST_IMAGE(
      imageRequest(recipe.id, imageFormData(PNG_BYTES, 'image/png', 'photo.png')),
      { params: Promise.resolve({ id: String(recipe.id) }) }
    );

    expect(response.status).toBe(401);
  });

  // TC-009-05
  test('invalid file type is rejected', async () => {
    const recipe = RecipeModel.create('Photo Recipe', user1Id);

    const response = await POST_IMAGE(
      imageRequest(
        recipe.id,
        imageFormData(Buffer.from('not an image'), 'text/plain', 'notes.txt'),
        user1Token
      ),
      { params: Promise.resolve({ id: String(recipe.id) }) }
    );

    expect(response.status).toBe(400);
    const stored = await RecipeModelAsync.findById(recipe.id);
    expect(stored?.image_path).toBeFalsy();
  });

  // TC-009-06
  test('serves a stored image with the correct content type', async () => {
    const recipe = RecipeModel.create('Photo Recipe', user1Id);

    const upload = await POST_IMAGE(
      imageRequest(recipe.id, imageFormData(PNG_BYTES, 'image/png', 'photo.png'), user1Token),
      { params: Promise.resolve({ id: String(recipe.id) }) }
    );
    const uploadData = await upload.json();
    createdImagePaths.push(uploadData.imagePath);

    const response = await GET_IMAGE(
      new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}/image`),
      { params: Promise.resolve({ id: String(recipe.id) }) }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
  });

  // TC-009-07
  test('serving returns 404 when the recipe has no photo', async () => {
    const recipe = RecipeModel.create('No Photo Recipe', user1Id);

    const response = await GET_IMAGE(
      new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}/image`),
      { params: Promise.resolve({ id: String(recipe.id) }) }
    );

    expect(response.status).toBe(404);
  });

  // TC-009-08
  test('recipe list surfaces imagePath', async () => {
    const recipe = RecipeModel.create('Photo Recipe', user1Id);

    const upload = await POST_IMAGE(
      imageRequest(recipe.id, imageFormData(PNG_BYTES, 'image/png', 'photo.png'), user1Token),
      { params: Promise.resolve({ id: String(recipe.id) }) }
    );
    const uploadData = await upload.json();
    createdImagePaths.push(uploadData.imagePath);

    const result = await RecipeModelAsync.listAllWithScoreAsync(
      1,
      10,
      'date',
      undefined,
      'menstruation'
    );
    const item = result.recipes.find((r) => r.id === recipe.id);
    expect(item?.imagePath).toBeTruthy();
  });
});
