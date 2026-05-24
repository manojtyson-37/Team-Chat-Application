import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { updateProfilePicture, getUserById } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { profilePictureUrl } = await req.json();

    if (!profilePictureUrl || typeof profilePictureUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid profile picture URL' }, { status: 400 });
    }

    // Update the database
    await updateProfilePicture(user.userId, profilePictureUrl);

    // Fetch and return the updated user
    const updatedUser = await getUserById(user.userId);

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 500 });
  }
}
