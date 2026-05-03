'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';

const MermaidBlock = dynamic(() => import('@/components/MermaidBlock'), {
  ssr: false,
  loading: () => <div className="text-sm text-slate-400 py-4">图表加载中...</div>,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

interface Props {
  message: Message;
  isStreaming: boolean;
}

export default function MessageBubble({ message: msg, isStreaming }: Props) {
  return (
    <div className={`message-bubble flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] px-4 py-3 rounded-2xl ${
          msg.role === 'user'
            ? 'bg-slate-900 text-white rounded-br-sm shadow-sm'
            : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-sm'
        }`}
      >
        {msg.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={msg.image}
            alt="上传的图片"
            className="max-w-full rounded-xl mb-2 max-h-60 object-cover"
          />
        )}
        {msg.role === 'assistant' ? (
          <div className={`prose-chat text-[15px] leading-relaxed ${isStreaming ? 'typing-cursor' : ''}`}>
            {msg.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children }) {
                    const match = /language-mermaid/.exec(className || '');
                    if (match && !isStreaming) {
                      return <MermaidBlock code={String(children).replace(/\n$/, '')} />;
                    }
                    if (match) {
                      return (
                        <pre className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 overflow-x-auto">
                          <code>{children}</code>
                        </pre>
                      );
                    }
                    return (
                      <code className={`${className || ''} bg-slate-100 px-1.5 py-0.5 rounded-md text-sm text-slate-700`}>
                        {children}
                      </code>
                    );
                  },
                  pre({ children }) {
                    return <>{children}</>;
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 py-0.5">
                <span className="thinking-dot" />
                <span className="thinking-dot [animation-delay:0.2s]" />
                <span className="thinking-dot [animation-delay:0.4s]" />
              </div>
            )}
          </div>
        ) : (
          msg.content && (
            <div className="text-[15px] leading-relaxed">{msg.content}</div>
          )
        )}
      </div>
    </div>
  );
}
