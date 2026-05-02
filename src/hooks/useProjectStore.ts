'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/lib/projectTypes';
import { ProgressData } from '@/lib/progressTypes';
import { ConstructionData } from '@/lib/constructionTypes';
import { mergeQuestProgress, mergeConstructionData } from '@/lib/mergeDecisions';

const STORAGE_KEY = 'ai-home-designer-projects';

function loadProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // silent
  }
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function useProjectStore() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadProjects();
    setProjects(loaded);
    if (loaded.length > 0) {
      setActiveProjectId(loaded[0].id);
    }
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  const createProject = useCallback(
    (name: string, mode: 'quest' | 'construction') => {
      const project: Project = {
        id: genId(),
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        mode,
        decisions: [],
        budget: { total: null, allocated: 0 },
        timeline: { start: null, end: null },
        currentStage: 'basic_info',
        constructionData: null,
        sessionIds: [],
      };
      const updated = [project, ...projects];
      setProjects(updated);
      saveProjects(updated);
      setActiveProjectId(project.id);
      return project.id;
    },
    [projects]
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<Project>) => {
      const updated = projects.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
      );
      setProjects(updated);
      saveProjects(updated);
    },
    [projects]
  );

  const deleteProject = useCallback(
    (id: string) => {
      const updated = projects.filter((p) => p.id !== id);
      setProjects(updated);
      saveProjects(updated);
      if (activeProjectId === id) {
        setActiveProjectId(updated.length > 0 ? updated[0].id : null);
      }
    },
    [projects, activeProjectId]
  );

  const addSessionToProject = useCallback(
    (projectId: string, sessionId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      if (project.sessionIds.includes(sessionId)) return;
      updateProject(projectId, {
        sessionIds: [...project.sessionIds, sessionId],
      });
    },
    [projects, updateProject]
  );

  const mergeProgress = useCallback(
    (projectId: string, progress: ProgressData) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const patch = mergeQuestProgress(project, progress);
      updateProject(projectId, patch);
    },
    [projects, updateProject]
  );

  const mergeConstruction = useCallback(
    (projectId: string, data: ConstructionData) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const patch = mergeConstructionData(project, data);
      updateProject(projectId, patch);
    },
    [projects, updateProject]
  );

  const renameProject = useCallback(
    (id: string, name: string) => {
      updateProject(id, { name });
    },
    [updateProject]
  );

  return {
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    createProject,
    updateProject,
    deleteProject,
    addSessionToProject,
    mergeProgress,
    mergeConstruction,
    renameProject,
  };
}
