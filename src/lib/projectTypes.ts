import { Decision } from './progressTypes';
import { ConstructionData } from './constructionTypes';

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  mode: 'quest' | 'construction';

  // Quest mode accumulated data
  decisions: Decision[];
  budget: { total: number | null; allocated: number };
  timeline: { start: string | null; end: string | null };
  currentStage: string;

  // Construction mode accumulated data
  constructionData: ConstructionData | null;

  sessionIds: string[];
}
