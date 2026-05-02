import { ConstructionData } from './constructionTypes';

export function parseConstruction(rawContent: string): {
  displayContent: string;
  construction: ConstructionData | null;
} {
  const startTag = '[CONSTRUCTION]';
  const endTag = '[/CONSTRUCTION]';

  const startIdx = rawContent.indexOf(startTag);

  if (startIdx === -1) {
    return { displayContent: rawContent, construction: null };
  }

  const endIdx = rawContent.indexOf(endTag, startIdx);

  if (endIdx === -1) {
    const displayContent = rawContent.substring(0, startIdx).trimEnd();
    return { displayContent, construction: null };
  }

  const jsonStr = rawContent.substring(startIdx + startTag.length, endIdx).trim();
  const displayContent = (
    rawContent.substring(0, startIdx) + rawContent.substring(endIdx + endTag.length)
  ).trim();

  try {
    const construction = JSON.parse(jsonStr) as ConstructionData;
    return { displayContent, construction };
  } catch {
    return { displayContent, construction: null };
  }
}
