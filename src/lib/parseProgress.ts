import { ProgressData } from './progressTypes';

function tryRepairJson(raw: string): string {
  // Remove trailing commas before } or ]
  return raw.replace(/,\s*([}\]])/g, '$1');
}

function coerceProgressData(obj: unknown): ProgressData | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;

  const decisions = Array.isArray(o.decisions)
    ? o.decisions.map((d: unknown) => {
        if (!d || typeof d !== 'object') return null;
        const dd = d as Record<string, unknown>;
        return {
          id: String(dd.id ?? ''),
          category: String(dd.category ?? ''),
          label: String(dd.label ?? ''),
          value: dd.value !== undefined ? (dd.value as string | null) : null,
          status: (['confirmed', 'revisiting', 'pending'].includes(dd.status as string)
            ? dd.status
            : 'pending') as 'confirmed' | 'revisiting' | 'pending',
          is_new: Boolean(dd.is_new),
          estimated_cost:
            typeof dd.estimated_cost === 'number' ? dd.estimated_cost : null,
        };
      }).filter(Boolean)
    : [];

  const budget = o.budget && typeof o.budget === 'object'
    ? o.budget as Record<string, unknown>
    : {};
  const timeline = o.timeline && typeof o.timeline === 'object'
    ? o.timeline as Record<string, unknown>
    : {};

  return {
    current_stage: typeof o.current_stage === 'string' ? o.current_stage : 'basic_info',
    budget: {
      total: typeof budget.total === 'number' ? budget.total : null,
      allocated: typeof budget.allocated === 'number' ? budget.allocated : 0,
    },
    timeline: {
      start: typeof timeline.start === 'string' ? timeline.start : null,
      end: typeof timeline.end === 'string' ? timeline.end : null,
    },
    decisions: decisions as ProgressData['decisions'],
  };
}

export function parseProgress(rawContent: string): {
  displayContent: string;
  progress: ProgressData | null;
} {
  const startTag = '[PROGRESS]';
  const endTag = '[/PROGRESS]';

  const startIdx = rawContent.indexOf(startTag);

  if (startIdx === -1) {
    return { displayContent: rawContent, progress: null };
  }

  const endIdx = rawContent.indexOf(endTag, startIdx);

  if (endIdx === -1) {
    const displayContent = rawContent.substring(0, startIdx).trimEnd();
    return { displayContent, progress: null };
  }

  const jsonStr = rawContent.substring(startIdx + startTag.length, endIdx).trim();
  const displayContent = (
    rawContent.substring(0, startIdx) + rawContent.substring(endIdx + endTag.length)
  ).trim();

  // First try direct parse, then try repaired JSON
  for (const candidate of [jsonStr, tryRepairJson(jsonStr)]) {
    try {
      const parsed = JSON.parse(candidate);
      const progress = coerceProgressData(parsed);
      if (progress) return { displayContent, progress };
    } catch {
      // try next candidate
    }
  }

  return { displayContent, progress: null };
}
