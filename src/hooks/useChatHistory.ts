'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ChatSession {
  id: string;
  title: string;
  messages: { role: 'user' | 'assistant'; content: string; image?: string }[];
  createdAt: number;
  updatedAt: number;
  projectId?: string;
  tag?: string;
}

const STORAGE_KEY = 'ai-home-designer-history';

function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage 满了就静默失败
  }
}

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    setSessions(loadSessions());
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        try { setSessions(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const currentSession = sessions.find((s) => s.id === currentId) || null;

  const createSession = useCallback((projectId?: string, tag?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const session: ChatSession = {
      id,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      projectId,
      tag,
    };
    setSessions((prev) => {
      const updated = [session, ...prev];
      saveSessions(updated);
      return updated;
    });
    setCurrentId(id);
    return id;
  }, []);

  const updateSession = useCallback((id: string, messages: ChatSession['messages']) => {
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== id) return s;
        const firstUser = messages.find((m) => m.role === 'user');
        const title = firstUser
          ? firstUser.content.slice(0, 20) + (firstUser.content.length > 20 ? '...' : '')
          : '新对话';
        return { ...s, title, messages, updatedAt: Date.now() };
      });
      saveSessions(updated);
      return updated;
    });
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSessions(updated);
      return updated;
    });
    setCurrentId((prev) => (prev === id ? null : prev));
  }, []);

  const switchSession = useCallback((id: string) => {
    setCurrentId(id);
  }, []);

  const clearCurrent = useCallback(() => {
    setCurrentId(null);
  }, []);

  const getSessionsByProject = useCallback((projectId: string) => {
    return sessions.filter((s) => s.projectId === projectId);
  }, [sessions]);

  return {
    sessions,
    currentId,
    currentSession,
    createSession,
    updateSession,
    deleteSession,
    switchSession,
    clearCurrent,
    getSessionsByProject,
  };
}
