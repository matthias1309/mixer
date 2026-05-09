// User types

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
}
