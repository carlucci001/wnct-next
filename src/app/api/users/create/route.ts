import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/user';

/**
 * POST /api/users/create
 * Creates a new user with both Firebase Auth and Firestore document
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, phone, role, accountType, photoURL, password } = body;

    // Validate required fields
    if (!email || !displayName) {
      return NextResponse.json(
        { error: 'Email and display name are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: UserRole[] = [
      'admin',
      'business-owner',
      'editor-in-chief',
      'editor',
      'content-contributor',
      'commenter',
      'reader',
      'guest',
    ];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Dynamic imports to avoid Turbopack symlink issues on Windows
    const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
    const { getAuth } = await import('firebase-admin/auth');
    const { getFirestore } = await import('firebase-admin/firestore');

    // Initialize Firebase Admin
    getFirebaseAdmin();
    const auth = getAuth();
    const db = getFirestore();

    // Generate a temporary password if not provided
    const userPassword = password || generateTempPassword();

    // Create Firebase Auth user
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        displayName,
        password: userPassword,
        photoURL: photoURL || undefined,
      });
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }
      throw authError;
    }

    // Create Firestore user document with the Auth UID
    const now = new Date().toISOString();
    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      phone: phone || '',
      role: role || 'reader',
      accountType: accountType || 'free',
      status: 'active',
      photoURL: photoURL || '',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.uid,
        email,
        displayName,
        role: role || 'reader',
      },
      // Only include temp password in response if we generated one
      ...(password ? {} : { tempPassword: userPassword }),
      message: password
        ? 'User created successfully'
        : 'User created with temporary password. Please share it securely with the user.',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a secure temporary password
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
