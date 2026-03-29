import type { CommunityMetadata } from '@shared/types';

/** Short label for programme cards; null when no linked communities. */
export function formatRecommendedForCommunities(meta: CommunityMetadata[]): string | null {
  if (!meta.length) return null;
  const names = meta.map((m) => m.community_name);
  if (names.length === 1) return `Recommended for ${names[0]}`;
  if (names.length === 2) return `Recommended for ${names[0]} · ${names[1]}`;
  return `Recommended for ${names[0]} · ${names[1]} +${names.length - 2}`;
}
