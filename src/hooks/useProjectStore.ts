'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/lib/projectTypes';
import { ProgressData } from '@/lib/progressTypes';
import { ConstructionData } from '@/lib/constructionTypes';
import { mergeQuestProgress, mergeConstructionData } from '@/lib/mergeDecisions';

const STORAGE_KEY = 'ai-home-designer-projects';
const ACTIVE_KEY = 'ai-home-designer-active-project';

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
    const savedActive = localStorage.getItem(ACTIVE_KEY);
    if (savedActive && loaded.find((p) => p.id === savedActive)) {
      setActiveProjectId(savedActive);
    } else if (loaded.length > 0) {
      setActiveProjectId(loaded[0].id);
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        try { setProjects(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Persists active project ID to localStorage so it survives page reload
  const setActiveProjectIdPersist = useCallback((id: string | null) => {
    setActiveProjectId(id);
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  }, []);

  const createProject = useCallback((name: string, mode: 'quest' | 'construction') => {
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
    setProjects((prev) => {
      const updated = [project, ...prev];
      saveProjects(updated);
      return updated;
    });
    setActiveProjectIdPersist(project.id);
    return project.id;
  }, [setActiveProjectIdPersist]);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
      );
      saveProjects(updated);
      return updated;
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      saveProjects(updated);
      setActiveProjectId((activeId) => {
        const next = activeId === id ? (updated.length > 0 ? updated[0].id : null) : activeId;
        if (next) localStorage.setItem(ACTIVE_KEY, next);
        else localStorage.removeItem(ACTIVE_KEY);
        return next;
      });
      return updated;
    });
  }, []);

  const addSessionToProject = useCallback((projectId: string, sessionId: string) => {
    setProjects((prev) => {
      const project = prev.find((p) => p.id === projectId);
      if (!project || project.sessionIds.includes(sessionId)) return prev;
      const updated = prev.map((p) =>
        p.id === projectId
          ? { ...p, sessionIds: [...p.sessionIds, sessionId], updatedAt: Date.now() }
          : p
      );
      saveProjects(updated);
      return updated;
    });
  }, []);

  const mergeProgress = useCallback((projectId: string, progress: ProgressData) => {
    setProjects((prev) => {
      const project = prev.find((p) => p.id === projectId);
      if (!project) return prev;
      const patch = mergeQuestProgress(project, progress);
      const updated = prev.map((p) => (p.id === projectId ? { ...p, ...patch } : p));
      saveProjects(updated);
      return updated;
    });
  }, []);

  const mergeConstruction = useCallback((projectId: string, data: ConstructionData) => {
    setProjects((prev) => {
      const project = prev.find((p) => p.id === projectId);
      if (!project) return prev;
      const patch = mergeConstructionData(project, data);
      const updated = prev.map((p) => (p.id === projectId ? { ...p, ...patch } : p));
      saveProjects(updated);
      return updated;
    });
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, name, updatedAt: Date.now() } : p
      );
      saveProjects(updated);
      return updated;
    });
  }, []);

  return {
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId: setActiveProjectIdPersist,
    createProject,
    updateProject,
    deleteProject,
    addSessionToProject,
    mergeProgress,
    mergeConstruction,
    renameProject,
  };
}
