import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '小马科技 | XIAOMAAI.NET - 全球AI工具高阶生产力中枢',
  description: '小马科技 - 全球顶级AI工具聚合平台，赋能高阶生产力',
  icons: {
    icon: '/icon-light-32x32.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
