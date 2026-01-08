import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, newPassword, adminUid } = await request.json();

    if (!userId || !newPassword || !adminUid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin
    getFirebaseAdmin();
    const auth = getAuth();

    // Verify the requesting user is an admin
    // Get their custom claims or check Firestore
    const { getAdminFirestore } = await import('@/lib/firebase-admin');
    const db = getAdminFirestore();
    const adminDoc = await db.collection('users').doc(adminUid).get();

    if (!adminDoc.exists) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 403 }
      );
    }

    const adminData = adminDoc.data();
    const adminRoles = ['admin', 'business-owner'];

    if (!adminData?.role || !adminRoles.includes(adminData.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to change passwords' },
        { status: 403 }
      );
    }

    // Update the user's password
    await auth.updateUser(userId, {
      password: newPassword,
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error: unknown) {
    console.error('Error changing password:', error);
    const message = error instanceof Error ? error.message : 'Failed to change password';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}