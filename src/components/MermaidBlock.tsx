'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#fff7ed',
    primaryBorderColor: '#f97316',
    primaryTextColor: '#1a1a2e',
    lineColor: '#f97316',
    secondaryColor: '#fef3c7',
    tertiaryColor: '#ecfdf5',
    fontFamily: 'system-ui, sans-serif',
  },
  gantt: {
    titleTopMargin: 15,
    barHeight: 24,
    barGap: 6,
    topPadding: 40,
    fontSize: 13,
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    nodeSpacing: 30,
    rankSpacing: 50,
  },
});

let mermaidId = 0;

function sanitizeGantt(raw: string): string {
  const lines = raw.split('\n');
  const out: string[] = [];
  for (const line of lines) {
    let l = line;
    l = l.replace(/\b(active|done|crit)\s*,\s*/g, '');
    l = l.replace(/：/g, ':');
    l = l.replace(/,\s*$/, '');
    out.push(l);
  }
  return out.join('\n');
}

function sanitizeMermaid(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('gantt')) {
    return sanitizeGantt(trimmed);
  }
  return trimmed;
}

export default function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const id = `mermaid-${++mermaidId}`;
    let cancelled = false;
    const sanitized = sanitizeMermaid(code);

    mermaid
      .render(id, sanitized)
      .then(({ svg: renderedSvg }) => {
        if (!cancelled) setSvg(renderedSvg);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || '图表渲染失败');
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <pre className="text-xs text-red-500 bg-red-50 rounded-lg p-3 overflow-x-auto">
        {code}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
        图表加载中...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-chart my-3 overflow-x-auto rounded-xl border border-gray-100 bg-white p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
