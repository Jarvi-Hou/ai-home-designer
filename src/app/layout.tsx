import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI 家居设计师 — 智能装修助手',
  description:
    '基于小米 MiMo 大模型的智能装修助手，输入户型和需求，获得专业级装修建议、材料推荐和预算清单。',
  keywords: '装修,AI,智能设计,MiMo,家居,预算,材料推荐',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
