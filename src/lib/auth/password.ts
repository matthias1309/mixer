import bcrypt from 'bcryptjs';
import { BCRYPT } from '@lib/constants';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT.COST_FACTOR);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
