'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ChatSession {
  id: string;
  title: string;
  messages: { role: 'user' | 'assistant'; content: string; image?: string }[];
  createdAt: number;
  updatedAt: number;
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

  // 初始化加载
  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const currentSession = sessions.find((s) => s.id === currentId) || null;

  const createSession = useCallback(() => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const session: ChatSession = {
      id,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [session, ...sessions];
    setSessions(updated);
    saveSessions(updated);
    setCurrentId(id);
    return id;
  }, [sessions]);

  const updateSession = useCallback(
    (id: string, messages: ChatSession['messages']) => {
      const updated = sessions.map((s) => {
        if (s.id !== id) return s;
        // 用第一条用户消息做标题
        const firstUser = messages.find((m) => m.role === 'user');
        const title = firstUser
          ? firstUser.content.slice(0, 20) + (firstUser.content.length > 20 ? '...' : '')
          : '新对话';
        return { ...s, title, messages, updatedAt: Date.now() };
      });
      setSessions(updated);
      saveSessions(updated);
    },
    [sessions]
  );

  const deleteSession = useCallback(
    (id: string) => {
      const updated = sessions.filter((s) => s.id !== id);
      setSessions(updated);
      saveSessions(updated);
      if (currentId === id) setCurrentId(null);
    },
    [sessions, currentId]
  );

  const switchSession = useCallback((id: string) => {
    setCurrentId(id);
  }, []);

  const clearCurrent = useCallback(() => {
    setCurrentId(null);
  }, []);

  return {
    sessions,
    currentId,
    currentSession,
    createSession,
    updateSession,
    deleteSession,
    switchSession,
    clearCurrent,
  };
}
