import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { updateProfilePicture, getUserById } from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { profilePictureUrl } = await req.json();

    if (!profilePictureUrl || typeof profilePictureUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid profile picture URL' }, { status: 400 });
    }

    // Update the database
    await updateProfilePicture(user.id, profilePictureUrl);

    // Fetch and return the updated user
    const updatedUser = await getUserById(user.id);

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 500 });
  }
}
