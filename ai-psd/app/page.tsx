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
      // 1. 图像解析
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("图片加载失败"));
        img.src = uploadedImage;
      });

      const { width, height } = img;

      // 创建用户图片的 Canvas
      const userCanvas = document.createElement("canvas");
      userCanvas.width = width;
      userCanvas.height = height;
      const userCtx = userCanvas.getContext("2d")!;
      userCtx.drawImage(img, 0, 0);

      // 2. 创建白色背景 Canvas
      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = width;
      bgCanvas.height = height;
      const bgCtx = bgCanvas.getContext("2d")!;
      bgCtx.fillStyle = "#ffffff";
      bgCtx.fillRect(0, 0, width, height);

      // 3. PSD 结构组装
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

      // 4. 零成本导出
      const buffer = writePsd(psd);
      const blob = new Blob([buffer], { type: "application/octet-stream" });

      // 5. 极速下载
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
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-neutral-900 tracking-tight">
              AI to PSD
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Zap className="w-3.5 h-3.5" />
            <span>纯浏览器端处理</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full text-xs font-medium text-neutral-600 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            零服务器 · 零上传 · 即时生成
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight mb-4 text-balance">
            AI 透明图转多图层 PSD
          </h1>
          <p className="text-neutral-500 text-lg max-w-xl mx-auto text-pretty">
            上传 AI 生成的透明背景 PNG，一键在浏览器中生成带分离图层的 PSD
            文件
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          {/* Upload Area */}
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
                    ? "bg-neutral-50 border-neutral-400"
                    : "bg-white hover:bg-neutral-50"
                }
              `}
            >
              <div
                className={`
                m-6 rounded-xl border-2 border-dashed transition-all duration-200
                ${
                  isDragging
                    ? "border-neutral-400 bg-neutral-100"
                    : "border-neutral-200 hover:border-neutral-300"
                }
              `}
              >
                <div className="py-20 px-8 flex flex-col items-center justify-center">
                  <div
                    className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-200
                    ${isDragging ? "bg-neutral-200" : "bg-neutral-100"}
                  `}
                  >
                    <Upload
                      className={`w-7 h-7 transition-colors ${isDragging ? "text-neutral-600" : "text-neutral-400"}`}
                    />
                  </div>
                  <p className="text-neutral-900 font-medium text-lg mb-2">
                    点击或拖拽上传 AI 透明背景图 (PNG)
                  </p>
                  <p className="text-neutral-400 text-sm">
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
              {/* Preview */}
              <div className="relative group">
                <div className="aspect-video bg-[#f5f5f5] rounded-xl overflow-hidden flex items-center justify-center relative">
                  {/* Checkerboard Pattern */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                        linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                        linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
                      `,
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                    }}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="预览图片"
                    className="max-h-full max-w-full object-contain relative z-10"
                  />
                </div>
                {/* Clear Button */}
                <button
                  onClick={clearImage}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-neutral-600" />
                </button>
              </div>

              {/* File Info */}
              <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-neutral-50 rounded-lg">
                <div className="w-10 h-10 bg-white rounded-lg border border-neutral-200 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {fileName}
                  </p>
                  <p className="text-xs text-neutral-400">PNG 图像</p>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generatePsd}
                disabled={isProcessing}
                className={`
                  w-full mt-6 h-14 rounded-xl font-medium text-base
                  flex items-center justify-center gap-2.5
                  transition-all duration-200
                  ${
                    isProcessing
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      : "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.99]"
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

              {/* Success Message */}
              {showSuccess && (
                <div className="mt-4 flex items-center gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-800">
                    🎉 <span className="font-medium">生成成功！</span>{" "}
                    完全使用浏览器算力，0 服务器带宽消耗！
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-6">
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
              className="text-center p-6 rounded-xl bg-white border border-neutral-200"
            >
              <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <feature.icon className="w-5 h-5 text-neutral-600" />
              </div>
              <h3 className="font-medium text-neutral-900 mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-neutral-500">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-neutral-400">
          <p>基于 ag-psd 构建 · 浏览器原生渲染</p>
        </footer>
      </main>
    </div>
  );
}
