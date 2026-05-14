'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          🍳 Recipe Manager
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover recipes you can cook with ingredients you have
        </p>

        {user ? (
          <div className="space-y-4">
            <p className="text-lg text-gray-700">Welcome, {user.email}!</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/recipes/new"
                className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
              >
                Create Recipe
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
            >
              Register
            </Link>
          </div>
        )}

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Create Recipes</h3>
            <p className="text-gray-600">Share your favorite recipes with the community</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Smart Filtering</h3>
            <p className="text-gray-600">Find recipes using ingredients you have on hand</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Community</h3>
            <p className="text-gray-600">Explore recipes from other cooking enthusiasts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
