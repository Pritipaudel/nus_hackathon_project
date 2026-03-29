/** Body written by backend when an anonymous problem is mirrored to the community feed. */
export type ParsedProblemMirror = {
  problemId: string | null;
  problemCategoryLabel: string;
  severity: number;
  title: string;
  details: string;
};

/**
 * Parses mirrored problem posts. Older rows may lack `__problem_id__` — support actions are omitted then.
 */
export function parseCommunityProblemMirror(raw: string): ParsedProblemMirror | null {
  if (!raw.startsWith('Community problem ·')) return null;
  let text = raw.trimEnd();
  let problemId: string | null = null;
  const idMatch = /\n__problem_id__:([0-9a-f-]{36})\s*$/i.exec(text);
  if (idMatch) {
    problemId = idMatch[1] ?? null;
    text = text.slice(0, idMatch.index).trimEnd();
  }

  const lines = text.split(/\r?\n/);
  const catM = /^Community problem · (.+)$/.exec(lines[0] ?? '');
  if (!catM?.[1]) return null;
  const problemCategoryLabel = catM[1].trim();

  let severity = 1;
  const sevM = /^Severity: (\d)\/5$/.exec(lines[1] ?? '');
  if (sevM?.[1]) {
    const n = parseInt(sevM[1], 10);
    severity = Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : 1;
  }

  let i = 2;
  while (i < lines.length && (lines[i] ?? '').trim() === '') i++;

  const titleM = /^Title: (.+)$/.exec(lines[i] ?? '');
  if (!titleM?.[1]) return null;
  const title = titleM[1].trim();
  i += 1;

  let details = '';
  if (lines[i] === '' && lines[i + 1] === 'Details:') {
    details = lines
      .slice(i + 2)
      .join('\n')
      .trim();
  }

  return { problemId, problemCategoryLabel, severity, title, details };
}
