import { Suspense } from 'react'

const HomeContent = async () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Rajdhani', sans-serif; overflow-x: hidden; }
        :root {
          --neon-purple: #7E22CE;
          --aurora-green: #22C55E;
          --neon-pink: #EC4899;
          --tropical-yellow: #EAB308;
          --cyber-blue: #06B6D4;
        }
        .holo-title {
          font-family: 'Orbitron', sans-serif;
          font-size: clamp(2.5rem, 8vw, 6rem);
          font-weight: 900;
          text-transform: uppercase;
          background: linear-gradient(90deg, var(--neon-purple), var(--neon-pink), var(--cyber-blue), var(--aurora-green), var(--tropical-yellow), var(--neon-purple));
          background-size: 400% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: holoPulse 3s ease-in-out infinite, textShimmer 8s linear infinite;
          text-shadow: 0 0 20px rgba(126, 34, 206, 0.8), 0 0 40px rgba(236, 72, 153, 0.6), 0 0 60px rgba(6, 182, 212, 0.4);
        }
        @keyframes holoPulse { 0%, 100% { filter: brightness(1) contrast(1); } 50% { filter: brightness(1.3) contrast(1.2); } }
        @keyframes textShimmer { 0% { background-position: 0% 50%; } 100% { background-position: 400% 50%; } }
        .subtitle { font-size: 1.2rem; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.3em; }
        .stat-number {
          font-family: 'Orbitron', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--cyber-blue), var(--aurora-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .bento-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; padding: 2rem; max-width: 1400px; margin: 0 auto; }
        .holo-card {
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .holo-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px);
          pointer-events: none;
        }
        .holo-card:hover { transform: translateY(-5px); border-color: rgba(126, 34, 206, 0.5); box-shadow: 0 0 30px rgba(126, 34, 206, 0.3); }
        .hero-card, .batch-card { grid-column: span 2; min-height: 350px; display: flex; align-items: center; justify-content: center; text-align: center; }
        .neon-icon { font-size: 3rem; margin-bottom: 1rem; }
        .tag {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .tag-free { background: linear-gradient(135deg, var(--aurora-green), #10B981); color: #000; }
        .tag-api { background: linear-gradient(135deg, var(--neon-purple), var(--neon-pink)); color: #fff; }
        .tag-premium { background: linear-gradient(135deg, var(--tropical-yellow), #F97316); color: #000; }
        @media (max-width: 900px) { .bento-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .bento-grid { grid-template-columns: 1fr; } .hero-card, .batch-card { grid-column: span 1; } }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <header className="min-h-screen flex flex-col justify-center items-center px-4 pt-20 pb-10">
        <div className="text-center mb-8">
          <div className="mb-6">
            <img src="/ChatGPT Image 2026年5月21日 14_50_39.png" alt="小马AI Logo" className="w-36 h-36 mx-auto mb-4 object-contain" />
          </div>
          <h1 className="holo-title mb-4">XIAOMAAI.NET</h1>
          <p className="subtitle">全球AI工具高阶生产力中枢</p>
        </div>

        <div className="w-full max-w-xl mb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient(90deg, var(--neon-purple), var(--neon-pink), var(--cyber-blue), var(--aurora-green), var(--tropical-yellow), var(--neon-purple)) bg-size-400 animate-[borderFlow_4s_linear_infinite] rounded-xl blur-lg opacity-80 -inset-2"></div>
            <input 
              type="text" 
              placeholder="🔍 搜索 AI 工具、模型、API..." 
              className="w-full px-6 py-4 bg-black/90 rounded-lg text-white text-lg outline-none w-full"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="stat-number">128+</div>
            <div className="text-gray-400 text-sm uppercase tracking-wider">AI 工具</div>
          </div>
          <div className="text-center">
            <div className="stat-number">50+</div>
            <div className="text-gray-400 text-sm uppercase tracking-wider">大模型</div>
          </div>
          <div className="text-center">
            <div className="stat-number">10K+</div>
            <div className="text-gray-400 text-sm uppercase tracking-wider">用户</div>
          </div>
        </div>

        <div className="animate-bounce mt-8">
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-8 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', background: 'linear-gradient(90deg, #7E22CE, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>小马AI自研</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
        </div>
        <div className="bento-grid">
          <div className="holo-card hero-card">
            <div className="text-center">
              <div className="neon-icon">🐴</div>
              <h3 className="text-xl font-bold mb-2">AI 生产工厂</h3>
              <p className="text-gray-400 text-sm">小马AI核心引擎，聚合全球顶级AI能力</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className="tag tag-api">核心</span>
                <span className="tag tag-api">GPT</span>
                <span className="tag tag-api">Grok</span>
                <span className="tag tag-api">Gemini</span>
              </div>
            </div>
          </div>
          <div className="holo-card batch-card">
            <div className="text-center">
              <div className="neon-icon">🎬</div>
              <h3 className="text-xl font-bold mb-2">批量生图生视频</h3>
              <p className="text-gray-400 text-sm">小马AI核心视觉工具，带有PSD分层功能</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className="tag tag-api">Image2</span>
                <span className="tag tag-api">Seedance2</span>
                <span className="tag tag-api">Photoshop</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-8 w-1 bg-gradient-to-b from-cyan-500 to-green-500 rounded-full"></div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', background: 'linear-gradient(90deg, #06B6D4, #22C55E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>小马AI精选</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
        </div>
        <div className="bento-grid">
          {[
            { id: 'gpt4', name: 'GPT-4 Turbo', desc: '最强大的语言模型，支持128K上下文', icon: '🧠', tags: ['API', 'Premium'], url: 'https://openai.com/index/gpt-4-turbo/' },
            { id: 'claude', name: 'Claude 3 Opus', desc: 'Anthropic旗舰模型，超长上下文', icon: '🎭', tags: ['API'], url: 'https://www.anthropic.com/claude' },
            { id: 'midjourney', name: 'Midjourney V6', desc: '顶级AI绘画，极致美学创作', icon: '🖼️', tags: ['Premium'], size: 'wide', url: 'https://www.midjourney.com/' },
            { id: 'stable', name: 'Stable Diffusion 3', desc: '开源图像生成，无限可能', icon: '🌀', tags: ['Free', 'API'], url: 'https://stability.ai/stable-diffusion-3' },
            { id: 'suno', name: 'Suno AI', desc: 'AI音乐创作，秒生神曲', icon: '🎵', tags: ['Premium'], url: 'https://suno.ai/' },
            { id: 'runway', name: 'Runway Gen-3', desc: '下一代AI视频生成', icon: '🎬', tags: ['Premium'], size: 'tall', url: 'https://runwayml.com/' },
            { id: 'gemini', name: 'Gemini Ultra', desc: 'Google最强多模态AI', icon: '💎', tags: ['API'], url: 'https://deepmind.google/gemini' },
            { id: 'copilot', name: 'GitHub Copilot', desc: 'AI编程助手，代码自动补全', icon: '👨‍💻', tags: ['Premium'], url: 'https://github.com/features/copilot' },
            { id: 'perplexity', name: 'Perplexity AI', desc: 'AI搜索引擎，实时知识获取', icon: '🔍', tags: ['Free', 'API'], size: 'wide', url: 'https://www.perplexity.ai/' },
            { id: 'elevenlabs', name: 'ElevenLabs', desc: '超真实AI语音克隆', icon: '🗣️', tags: ['API'], url: 'https://elevenlabs.io/' },
            { id: 'heygen', name: 'HeyGen', desc: 'AI数字人视频生成', icon: '👤', tags: ['Premium'], url: 'https://www.heygen.com/' },
            { id: 'cursor', name: 'Cursor IDE', desc: 'AI优先的代码编辑器', icon: '⚡', tags: ['Free'], url: 'https://cursor.com/' },
          ].map(tool => (
            <div 
              key={tool.id} 
              className={`holo-card ${tool.size === 'tall' ? 'row-span-2' : ''} ${tool.size === 'wide' ? 'col-span-2' : ''}`}
              onClick={() => tool.url && window.open(tool.url, '_blank')}
              style={{ cursor: tool.url ? 'pointer' : 'default' }}
            >
              <div className="neon-icon">{tool.icon}</div>
              <h3 className="text-lg font-bold mb-1">{tool.name}</h3>
              <p className="text-gray-400 text-sm mb-3">{tool.desc}</p>
              <div className="flex flex-wrap gap-2">
                {tool.tags.map(tag => (
                  <span key={tag} className={`tag tag-${tag.toLowerCase()}`}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-12 px-4 text-center border-t border-white/10">
        <p className="text-gray-500 text-sm">© 2024 小马AI | XIAOMAAI.NET | 全球AI工具高阶生产力中枢</p>
        <p className="text-gray-600 text-xs mt-2">Powered by Neon Chaos Engine™</p>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-purple-500 text-xl font-bold animate-pulse">Loading...</div>
    </div>}>
      <HomeContent />
    </Suspense>
  )
}