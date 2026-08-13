import { getBackend } from '@/services/backend';
import { isLocalUri } from '@/services/backend/types';
import type { TestResult, User } from '@/types';

/**
 * Promotes device-local image paths (`file://…`) to durable URLs before a push.
 *
 * Without this, an avatar or a result photo taken on a phone points at a file
 * that does not exist on any other device — the record syncs, the picture does
 * not. Upload failures are non-fatal on purpose: a photo that will not upload
 * must never block the athlete's actual data from syncing.
 */

export interface UploadedImages {
  user: User | null;
  results: TestResult[];
  /** How many URIs were actually promoted — used to skip a pointless re-push. */
  uploaded: number;
}

export async function uploadPendingImages(
  uid: string,
  user: User | null,
  results: TestResult[],
): Promise<UploadedImages> {
  const backend = getBackend();
  let uploaded = 0;

  let nextUser = user;
  if (user && isLocalUri(user.avatarUri)) {
    const url = await backend.uploadImage(uid, user.avatarUri!, `avatar-${Date.now()}.jpg`);
    if (url !== user.avatarUri) {
      nextUser = { ...user, avatarUri: url };
      uploaded += 1;
    }
  }

  const nextResults: TestResult[] = [];
  for (const result of results) {
    if (!isLocalUri(result.photoUri)) {
      nextResults.push(result);
      continue;
    }
    const url = await backend.uploadImage(uid, result.photoUri!, `results/${result.id}.jpg`);
    if (url === result.photoUri) {
      nextResults.push(result);
    } else {
      nextResults.push({ ...result, photoUri: url });
      uploaded += 1;
    }
  }

  return { user: nextUser, results: nextResults, uploaded };
}
