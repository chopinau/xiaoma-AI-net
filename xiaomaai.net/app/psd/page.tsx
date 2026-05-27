"use client";

import { useState, useCallback, useRef } from "react";
import { writePsd } from "ag-psd";
import {
  Upload,
  Rocket,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  X,
  Layers,
  Zap,
  Home,
} from "lucide-react";

export default function PsdConverter() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.includes("png")) {
      alert("请上传 PNG 格式的图片");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setShowSuccess(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearImage = useCallback(() => {
    setUploadedImage(null);
    setFileName("");
    setShowSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const generatePsd = useCallback(async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);
    setShowSuccess(false);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("图片加载失败"));
        img.src = uploadedImage;
      });

      const { width, height } = img;

      const userCanvas = document.createElement("canvas");
      userCanvas.width = width;
      userCanvas.height = height;
      const userCtx = userCanvas.getContext("2d")!;
      userCtx.drawImage(img, 0, 0);

      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = width;
      bgCanvas.height = height;
      const bgCtx = bgCanvas.getContext("2d")!;
      bgCtx.fillStyle = "#ffffff";
      bgCtx.fillRect(0, 0, width, height);

      const psd = {
        width,
        height,
        children: [
          {
            name: "背景图层 (本地生成)",
            canvas: bgCanvas,
            left: 0,
            top: 0,
          },
          {
            name: "AI 提取主体",
            canvas: userCanvas,
            left: 0,
            top: 0,
          },
        ],
      };

      const buffer = writePsd(psd);
      const blob = new Blob([buffer], { type: "application/octet-stream" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "XiaomaAI_Local_Export.psd";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowSuccess(true);
    } catch (error) {
      console.error("PSD 生成失败:", error);
      alert("生成失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0f0f1a]">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white tracking-tight">
              AI to PSD
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Zap className="w-3.5 h-3.5" />
              <span>纯浏览器端处理</span>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>返回主页</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-full text-xs font-medium text-purple-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            零服务器 · 零上传 · 即时生成
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4 text-balance">
            AI 透明图转多图层 PSD
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto text-pretty">
            上传 AI 生成的透明背景 PNG，一键在浏览器中生成带分离图层的 PSD
            文件
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-white/5 overflow-hidden">
            {!uploadedImage ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative cursor-pointer transition-all duration-200
                  ${
                    isDragging
                      ? "bg-white/10 border-white/40"
                      : "bg-transparent hover:bg-white/5"
                  }
                `}
              >
                <div
                  className={`
                m-6 rounded-xl border-2 border-dashed transition-all duration-200
                ${
                  isDragging
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-white/20 hover:border-white/40"
                }
              `}
                >
                  <div className="py-20 px-8 flex flex-col items-center justify-center">
                    <div
                      className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-200
                    ${isDragging ? "bg-purple-500/30" : "bg-white/10"}
                  `}
                    >
                      <Upload
                        className={`w-7 h-7 transition-colors ${isDragging ? "text-purple-400" : "text-gray-400"}`}
                      />
                    </div>
                    <p className="text-white font-medium text-lg mb-2">
                      点击或拖拽上传 AI 透明背景图 (PNG)
                    </p>
                    <p className="text-gray-500 text-sm">
                      仅支持 PNG 格式 · 文件不会离开你的浏览器
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="p-6">
                <div className="relative group">
                  <div className="aspect-video bg-slate-800/50 rounded-xl overflow-hidden flex items-center justify-center relative">
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: `
                        linear-gradient(45deg, #333 25%, transparent 25%),
                        linear-gradient(-45deg, #333 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #333 75%),
                        linear-gradient(-45deg, transparent 75%, #333 75%)
                      `,
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                      }}
                    />
                    <img
                      src={uploadedImage}
                      alt="预览图片"
                      className="max-h-full max-w-full object-contain relative z-10"
                    />
                  </div>
                  <button
                    onClick={clearImage}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center shadow-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 bg-white/10 rounded-lg border border-white/10 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {fileName}
                    </p>
                    <p className="text-xs text-gray-500">PNG 图像</p>
                  </div>
                </div>

                <button
                  onClick={generatePsd}
                  disabled={isProcessing}
                  className={`
                  w-full mt-6 h-14 rounded-xl font-medium text-base
                  flex items-center justify-center gap-2.5
                  transition-all duration-200
                  ${
                    isProcessing
                      ? "bg-white/10 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 active:scale-[0.99]"
                  }
                `}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>正在生成中...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      <span>🚀 在浏览器中生成多图层 PSD</span>
                    </>
                  )}
                </button>

                {showSuccess && (
                  <div className="mt-4 flex items-center gap-3 px-4 py-3.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-sm text-emerald-300">
                      🎉 <span className="font-medium">生成成功！</span>{" "}
                      完全使用浏览器算力，0 服务器带宽消耗！
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              {
                icon: Zap,
                title: "即时处理",
                desc: "无需等待服务器响应",
              },
              {
                icon: Layers,
                title: "分层输出",
                desc: "背景层 + 主体层分离",
              },
              {
                icon: CheckCircle2,
                title: "隐私安全",
                desc: "文件永不离开本地",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="text-center p-4 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-medium text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>基于 ag-psd 构建 · 浏览器原生渲染</p>
        </footer>
      </main>
    </div>
  );
}