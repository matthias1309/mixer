export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) && email.length <= 255;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return null;
}

export function validateRecipeName(name: string): string | null {
  if (!name || name.trim().length === 0 || name.length > 100) {
    return 'Recipe name must be 1-100 characters';
  }
  return null;
}
