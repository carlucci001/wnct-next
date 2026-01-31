import { NextResponse } from 'next/server';
import { getCollectionDocs, updateDocument } from '@/lib/firestoreServer';

export const dynamic = 'force-dynamic';

/**
 * POST - Pause all AI journalist schedules
 * Temporary endpoint to disable all scheduled runs
 */
export async function POST() {
  try {
    console.log('📡 Fetching all AI journalists...');

    const snapshot = await getCollectionDocs('aiJournalists');

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No AI journalists found' });
    }

    let pausedCount = 0;
    let alreadyPausedCount = 0;
    const results: any[] = [];

    for (const docSnap of snapshot.docs) {
      const agent = docSnap.data();
      const agentName = agent.name || docSnap.id;

      if (agent.schedule?.isEnabled) {
        console.log(`⏸️  Pausing: ${agentName}`);

        await updateDocument('aiJournalists', docSnap.id, {
          'schedule.isEnabled': false,
          'nextRunAt': null,
          'updatedAt': new Date().toISOString()
        });

        results.push({ id: docSnap.id, name: agentName, action: 'paused' });
        pausedCount++;
      } else {
        console.log(`✓  Already paused: ${agentName}`);
        results.push({ id: docSnap.id, name: agentName, action: 'already_paused' });
        alreadyPausedCount++;
      }
    }

    console.log(`\n✅ Done! Paused: ${pausedCount}, Already paused: ${alreadyPausedCount}`);

    return NextResponse.json({
      success: true,
      message: 'All AI journalist schedules paused',
      pausedCount,
      alreadyPausedCount,
      total: snapshot.docs.length,
      details: results
    });

  } catch (error) {
    console.error('❌ Error pausing agents:', error);
    return NextResponse.json(
      { error: 'Failed to pause agents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
