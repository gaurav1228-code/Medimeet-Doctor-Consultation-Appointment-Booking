// lib/auth-utils.js
import 'server-only';
import { auth } from '@clerk/nextjs/server';

export async function getAuthData() {
  try {
    const { userId, sessionClaims } = await auth();
    return { userId, sessionClaims };
  } catch (error) {
    // Handle auth errors gracefully for static generation
    return { userId: null, sessionClaims: null };
  }
}