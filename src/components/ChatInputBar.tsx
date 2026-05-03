'use client';

import { useRef } from 'react';

interface Props {
  input: string;
  isLoading: boolean;
  pendingImage: string | null;
  sendTip: string | null;
  mode: 'quest' | 'construction';
  onInputChange: (val: string) => void;
  onSend: () => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
}

export default function ChatInputBar({
  input, isLoading, pendingImage, sendTip, mode,
  onInputChange, onSend, onImageSelect, onClearImage,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {pendingImage && (
          <div className="relative inline-block mb-2">
            <img src={pendingImage} alt="待发送图片" className="h-20 rounded-lg border border-gray-200" />
            <button
              onClick={onClearImage}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 text-white
                rounded-full text-xs flex items-center justify-center hover:bg-gray-800"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onImageSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            aria-label="上传效果图"
            className="p-2.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50
              rounded-xl transition-colors shrink-0 disabled:opacity-40 min-h-[44px] min-w-[44px]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              onInputChange(e.target.value);
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 150) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="回答问题、输入你的选择...（Enter 发送）"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5
              text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
              placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={onSend}
            disabled={(!input.trim() && !pendingImage) || isLoading}
            className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium
              hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors shrink-0"
          >
            {isLoading ? '回复中...' : '发送'}
          </button>
        </div>
      </div>
      {sendTip && (
        <p className="text-xs text-orange-500 text-center mt-1 animate-pulse">{sendTip}</p>
      )}
      <p className="text-xs text-gray-400 text-center mt-1">
        {mode === 'construction'
          ? '告诉我施工进展 · 拍照给我看现场 · 说"通过"进入下一阶段'
          : '输入"跳过"跳过当前问题 · 输入"导出"生成方案文档 · 支持上传效果图'}
      </p>
    </div>
  );
}
