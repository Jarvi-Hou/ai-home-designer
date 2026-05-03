'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';

const MermaidBlock = dynamic(() => import('@/components/MermaidBlock'), {
  ssr: false,
  loading: () => <div className="text-sm text-gray-400 py-4">图表加载中...</div>,
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
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
          msg.role === 'user'
            ? 'bg-orange-500 text-white rounded-br-md'
            : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md'
        }`}
      >
        {msg.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={msg.image}
            alt="上传的图片"
            className="max-w-full rounded-lg mb-2 max-h-60 object-cover"
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
                        <pre className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 overflow-x-auto">
                          <code>{children}</code>
                        </pre>
                      );
                    }
                    return (
                      <code className={`${className || ''} bg-gray-100 px-1.5 py-0.5 rounded text-sm`}>
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
              <div className="flex items-center gap-1.5 text-gray-400">
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
