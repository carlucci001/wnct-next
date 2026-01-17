import { NextResponse } from 'next/server';
import { getNewsletter, updateNewsletter, deleteNewsletter } from '@/lib/newsletter';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const newsletter = await getNewsletter(params.id);
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }
    return NextResponse.json(newsletter);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch newsletter' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    await updateNewsletter(params.id, body);
    return NextResponse.json({ message: 'Newsletter updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update newsletter' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await deleteNewsletter(params.id);
    return NextResponse.json({ message: 'Newsletter deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete newsletter' }, { status: 500 });
  }
}
