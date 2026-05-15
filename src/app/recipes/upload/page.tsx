'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import PhotoUploadForm from '../../../components/recipe/PhotoUploadForm';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UploadRecipePage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="py-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Zurück zum Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">Rezept aus Foto hochladen</h1>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-700">
            📸 Machen Sie ein Foto von Ihrem Rezept oder einem Rezept aus einem Buch/Magazin. Unsere KI extrahiert die Zutaten automatisch.
          </p>
        </div>

        <PhotoUploadForm
          onRecipeCreated={(recipeId) => {
            // Redirect to recipe detail after creation
            router.push(`/recipes/${recipeId}`);
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
