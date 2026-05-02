import { ProgressData } from './progressTypes';

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

  try {
    const progress = JSON.parse(jsonStr) as ProgressData;
    return { displayContent, progress };
  } catch {
    return { displayContent, progress: null };
  }
}
