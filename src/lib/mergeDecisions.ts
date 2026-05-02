import { Decision } from './progressTypes';
import { ConstructionData, ConstructionStage } from './constructionTypes';
import { Project } from './projectTypes';
import { ProgressData } from './progressTypes';

export function mergeQuestProgress(project: Project, progress: ProgressData): Partial<Project> {
  const merged = new Map<string, Decision>();

  for (const d of project.decisions) {
    merged.set(d.id, { ...d, is_new: false });
  }

  for (const d of progress.decisions) {
    const existing = merged.get(d.id);
    if (!existing) {
      merged.set(d.id, { ...d, is_new: true });
    } else if (d.status === 'confirmed' && d.value !== null) {
      merged.set(d.id, { ...d, is_new: true });
    } else if (d.status === 'revisiting') {
      merged.set(d.id, { ...d, is_new: true });
    } else if (d.status === 'pending' && existing.status === 'pending') {
      merged.set(d.id, { ...d, is_new: false });
    }
  }

  const decisions = Array.from(merged.values());
  const allocated = decisions
    .filter((d) => d.status === 'confirmed' && d.estimated_cost !== null)
    .reduce((sum, d) => sum + (d.estimated_cost || 0), 0);

  return {
    decisions,
    budget: {
      total: progress.budget.total ?? project.budget.total,
      allocated,
    },
    timeline: {
      start: progress.timeline.start ?? project.timeline.start,
      end: progress.timeline.end ?? project.timeline.end,
    },
    currentStage: progress.current_stage || project.currentStage,
    updatedAt: Date.now(),
  };
}

export function mergeConstructionData(
  project: Project,
  newData: ConstructionData
): Partial<Project> {
  if (!project.constructionData) {
    return { constructionData: newData, updatedAt: Date.now() };
  }

  const existing = project.constructionData;
  const stageMap = new Map<string, ConstructionStage>();

  for (const s of existing.stages) {
    stageMap.set(s.id, s);
  }
  for (const s of newData.stages) {
    stageMap.set(s.id, s);
  }

  return {
    constructionData: {
      ...newData,
      stages: Array.from(stageMap.values()),
      budget: {
        planned_total: newData.budget.planned_total ?? existing.budget.planned_total,
        actual_total: Math.max(newData.budget.actual_total, existing.budget.actual_total),
      },
      timeline: {
        start: newData.timeline.start ?? existing.timeline.start,
        expected_end: newData.timeline.expected_end ?? existing.timeline.expected_end,
      },
    },
    updatedAt: Date.now(),
  };
}
