"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { env, AutoModel, AutoProcessor, RawImage } from "@huggingface/transformers"
import { Button } from "@/components/ui/button"
import { Download, Upload, Loader2, Cpu, CheckCircle2, ImageIcon, Home } from "lucide-react"



type ModelStatus = "idle" | "loading" | "ready" | "error"
type ProcessStatus = "idle" | "processing" | "done" | "error"

export default function AIBackgroundRemover() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>("idle")
  const [modelProgress, setModelProgress] = useState(0)
  const [processStatus, setProcessStatus] = useState<ProcessStatus>("idle")
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedBgColor, setSelectedBgColor] = useState<string | null>(null)

  const modelRef = useRef<Awaited<ReturnType<typeof AutoModel.from_pretrained>> | null>(null)
  const processorRef = useRef<Awaited<ReturnType<typeof AutoProcessor.from_pretrained>> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  const bgColors = [
    { name: "透明", value: null, style: "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3QgZmlsbD0iIzMzMyIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIi8+PHJlY3QgZmlsbD0iIzMzMyIgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiLz48cmVjdCBmaWxsPSIjNDQ0IiB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIi8+PHJlY3QgZmlsbD0iIzQ0NCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')]" },
    { name: "白色", value: "#ffffff", style: "bg-white" },
    { name: "黑色", value: "#000000", style: "bg-black" },
    { name: "红色", value: "#ef4444", style: "bg-red-500" },
    { name: "绿色", value: "#22c55e", style: "bg-green-500" },
    { name: "蓝色", value: "#3b82f6", style: "bg-blue-500" },
  ]

  // 加载模型
  const loadModel = useCallback(async () => {
    if (modelStatus === "loading" || modelStatus === "ready") return

    setModelStatus("loading")
    setModelProgress(0)

    try {
      const model = await AutoModel.from_pretrained("briaai/RMBG-1.4", {
        progress_callback: (progress: { progress?: number; status?: string }) => {
          if (progress.progress !== undefined) {
            setModelProgress(Math.round(progress.progress))
          }
        },
      })

      const processor = await AutoProcessor.from_pretrained("briaai/RMBG-1.4", {
        progress_callback: (progress: { progress?: number; status?: string }) => {
          if (progress.progress !== undefined) {
            setModelProgress(Math.round(progress.progress))
          }
        },
      })

      modelRef.current = model
      processorRef.current = processor
      setModelStatus("ready")
    } catch (error) {
      console.error("[v0] Model loading error:", error)
      setModelStatus("error")
    }
  }, [modelStatus])

  // 初始化时加载模型
  useEffect(() => {
    loadModel()
  }, [loadModel])

  // 处理图片
  const processImage = useCallback(async (imageUrl: string) => {
    if (!modelRef.current || !processorRef.current) {
      console.error("[v0] Model not loaded")
      return
    }

    setProcessStatus("processing")

    try {
      // 加载图片
      const image = await RawImage.fromURL(imageUrl)

      // 预处理
      const { pixel_values } = await processorRef.current(image)

      // 推理
      const { output } = await modelRef.current({ input: pixel_values })

      // 获取 mask 数据
      const maskData = output[0].data
      const maskWidth = output[0].dims[3]
      const maskHeight = output[0].dims[2]

      // 创建 canvas 进行合成
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // 绘制原始图片
      const img = new Image()
      img.crossOrigin = "anonymous"
      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.src = imageUrl
      })

      ctx.drawImage(img, 0, 0)

      // 获取图片像素数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data

      // 将 mask 缩放到原始图片尺寸并应用
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          // 计算对应 mask 中的位置
          const maskX = Math.floor((x / canvas.width) * maskWidth)
          const maskY = Math.floor((y / canvas.height) * maskHeight)
          const maskIdx = maskY * maskWidth + maskX
          const alpha = maskData[maskIdx]

          // 设置 alpha 通道
          const pixelIdx = (y * canvas.width + x) * 4
          pixels[pixelIdx + 3] = Math.round(alpha * 255)
        }
      }

      ctx.putImageData(imageData, 0, 0)

      // 导出为 PNG
      const resultUrl = canvas.toDataURL("image/png")
      setProcessedImage(resultUrl)
      setProcessStatus("done")
    } catch (error) {
      console.error("[v0] Processing error:", error)
      setProcessStatus("error")
    }
  }, [])

  // 处理文件上传
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        setOriginalImage(url)
        setProcessedImage(null)
        setSelectedBgColor(null)
        processImage(url)
      }
      reader.readAsDataURL(file)
    },
    [processImage]
  )

  // 处理拖拽
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (!file || !file.type.startsWith("image/")) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        setOriginalImage(url)
        setProcessedImage(null)
        setSelectedBgColor(null)
        processImage(url)
      }
      reader.readAsDataURL(file)
    },
    [processImage]
  )

  // 滑动对比处理
  const handleSliderMove = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return
      const rect = sliderRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
      setSliderPosition(percent)
    },
    []
  )

  const handleMouseDown = useCallback(() => setIsDragging(true), [])
  const handleMouseUp = useCallback(() => setIsDragging(false), [])
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) handleSliderMove(e.clientX)
    },
    [isDragging, handleSliderMove]
  )
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleSliderMove(e.touches[0].clientX)
    },
    [handleSliderMove]
  )

  // 下载处理后的图片
  const downloadImage = useCallback(() => {
    if (!processedImage) return

    // 如果选择了背景色，需要合成
    if (selectedBgColor) {
      const canvas = document.createElement("canvas")
      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // 填充背景色
        ctx.fillStyle = selectedBgColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 绘制抠图结果
        ctx.drawImage(img, 0, 0)

        // 下载
        const link = document.createElement("a")
        link.download = "removed-bg-with-color.png"
        link.href = canvas.toDataURL("image/png")
        link.click()
      }
      img.src = processedImage
    } else {
      const link = document.createElement("a")
      link.download = "removed-bg.png"
      link.href = processedImage
      link.click()
    }
  }, [processedImage, selectedBgColor])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* 模型加载状态栏 */}
      <div className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-purple-500" />
              <span className="font-mono text-sm font-medium text-slate-300">AI 视觉引擎</span>
            </div>
            <button onClick={() => window.location.href = "/"} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors ml-4"><Home className="w-4 h-4" /><span>返回主页</span></button>

            <div className="flex-1">
              {modelStatus === "loading" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>正在将 AI 视觉引擎载入您的浏览器内存... (首次加载需约40MB)</span>
                    <span className="font-mono text-cyan-400">{modelProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300"
                      style={{ width: `${modelProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {modelStatus === "ready" && (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>AI 引擎就绪 - 所有处理均在本地完成</span>
                </div>
              )}

              {modelStatus === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <span>模型加载失败，请刷新页面重试</span>
                </div>
              )}

              {modelStatus === "idle" && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>初始化中...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 标题 */}
      <header className="border-b border-slate-800/50 py-8 text-center">
        <h1 className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-3xl font-bold text-transparent">
          本地 AI 智能抠图工作台
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          基于 Transformers.js 的纯浏览器端 AI 图像处理 · 零服务器 · 零隐私泄露
        </p>
      </header>

      {/* 主工作区 */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* 左侧上传区 */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Upload className="h-4 w-4" />
              上传图片
            </h2>

            <div
              className={`relative flex min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${
                modelStatus === "ready"
                  ? "border-slate-700 hover:border-purple-500/50 hover:bg-slate-900/50"
                  : "cursor-not-allowed border-slate-800 opacity-50"
              }`}
              onClick={() => modelStatus === "ready" && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={modelStatus === "ready" ? handleDrop : undefined}
            >
              {originalImage ? (
                <div className="relative h-full w-full p-4">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="h-full max-h-[360px] w-full rounded object-contain"
                  />
                  {processStatus === "processing" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded bg-slate-950/80 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                        <span className="text-sm text-slate-300">AI 正在分析图像...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-8 text-center">
                  <div className="rounded-full bg-slate-800/50 p-6">
                    <ImageIcon className="h-12 w-12 text-slate-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-slate-300">拖拽图片到此处</p>
                    <p className="text-sm text-slate-500">或点击选择文件</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />
                    <span className="text-xs text-purple-400">图像将在本地完全处理，0 隐私泄露</span>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={modelStatus !== "ready"}
              />
            </div>
          </div>

          {/* 右侧对比区 */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <ImageIcon className="h-4 w-4" />
              抠图对比
            </h2>

            <div
              ref={sliderRef}
              className="relative flex min-h-[400px] items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            >
              {processedImage && originalImage ? (
                <>
                  {/* 原图 (底层) */}
                  <div className="absolute inset-0">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  {/* 处理后 (上层，可被裁切) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <div
                      className={`h-full w-full ${
                        selectedBgColor
                          ? ""
                          : "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3QgZmlsbD0iIzMzMyIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIi8+PHJlY3QgZmlsbD0iIzMzMyIgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiLz48cmVjdCBmaWxsPSIjNDQ0IiB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIi8+PHJlY3QgZmlsbD0iIzQ0NCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')]"
                      }`}
                      style={selectedBgColor ? { backgroundColor: selectedBgColor } : {}}
                    >
                      <img
                        src={processedImage}
                        alt="Processed"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>

                  {/* 滑块 */}
                  <div
                    className="absolute bottom-0 top-0 z-10 w-1 cursor-ew-resize bg-white shadow-lg"
                    style={{ left: `${sliderPosition}%` }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                  >
                    <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-900 shadow-lg">
                      <div className="flex gap-0.5">
                        <div className="h-4 w-0.5 rounded bg-white" />
                        <div className="h-4 w-0.5 rounded bg-white" />
                      </div>
                    </div>
                  </div>

                  {/* 标签 */}
                  <div className="absolute left-4 top-4 rounded bg-slate-900/80 px-2 py-1 text-xs text-slate-400">
                    原图
                  </div>
                  <div className="absolute right-4 top-4 rounded bg-slate-900/80 px-2 py-1 text-xs text-cyan-400">
                    抠图后
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-600">
                  <ImageIcon className="h-16 w-16" />
                  <span className="text-sm">等待图片处理...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 操作区 */}
        {processedImage && (
          <div className="mt-8 space-y-6 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            {/* 背景色选择 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-400">背景替换</h3>
              <div className="flex flex-wrap gap-3">
                {bgColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedBgColor(color.value)}
                    className={`group flex flex-col items-center gap-2 rounded-lg p-2 transition-all ${
                      selectedBgColor === color.value
                        ? "bg-purple-500/20 ring-2 ring-purple-500"
                        : "hover:bg-slate-800"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-lg border border-slate-700 ${color.style}`}
                    />
                    <span className="text-xs text-slate-500 group-hover:text-slate-300">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 下载按钮 */}
            <Button
              onClick={downloadImage}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 py-6 text-lg font-medium hover:from-purple-500 hover:to-cyan-500"
            >
              <Download className="mr-2 h-5 w-5" />
              下载透明 PNG
            </Button>
          </div>
        )}
      </main>

      {/* 隐藏的 Canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
