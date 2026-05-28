"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { Minus, Plus, Upload, Package, X, GripVertical } from "lucide-react"

interface SlicePreview {
  id: number
  dataUrl: string
}

export default function VisualGridSlicer() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [imageSrc, setImageSrc] = useState<string>("")
  const [rows, setRows] = useState(2)
  const [columns, setColumns] = useState(2)
  const [gap, setGap] = useState(0)
  const [slicePreviews, setSlicePreviews] = useState<SlicePreview[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  // 辅助线位置 (百分比)
  const [horizontalLines, setHorizontalLines] = useState<number[]>([])
  const [verticalLines, setVerticalLines] = useState<number[]>([])
  
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 初始化辅助线位置
  useEffect(() => {
    const newHorizontalLines: number[] = []
    const newVerticalLines: number[] = []
    
    for (let i = 1; i < rows; i++) {
      newHorizontalLines.push((i / rows) * 100)
    }
    for (let i = 1; i < columns; i++) {
      newVerticalLines.push((i / columns) * 100)
    }
    
    setHorizontalLines(newHorizontalLines)
    setVerticalLines(newVerticalLines)
  }, [rows, columns])

  // 生成预览
  useEffect(() => {
    if (!image) {
      setSlicePreviews([])
      return
    }
    generatePreviews()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, horizontalLines, verticalLines, gap])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        setImage(img)
        setImageSrc(event.target?.result as string)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImage(null)
    setImageSrc("")
    setSlicePreviews([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getSliceCoordinates = useCallback(() => {
    if (!image) return []

    const allHorizontal = [0, ...horizontalLines.sort((a, b) => a - b), 100]
    const allVertical = [0, ...verticalLines.sort((a, b) => a - b), 100]
    
    const coordinates: { x: number; y: number; width: number; height: number }[] = []
    
    const gapPx = gap
    const halfGap = gapPx / 2

    for (let r = 0; r < allHorizontal.length - 1; r++) {
      for (let c = 0; c < allVertical.length - 1; c++) {
        const x1 = (allVertical[c] / 100) * image.width
        const x2 = (allVertical[c + 1] / 100) * image.width
        const y1 = (allHorizontal[r] / 100) * image.height
        const y2 = (allHorizontal[r + 1] / 100) * image.height
        
        // 应用 gap
        const adjustedX1 = c === 0 ? x1 : x1 + halfGap
        const adjustedX2 = c === allVertical.length - 2 ? x2 : x2 - halfGap
        const adjustedY1 = r === 0 ? y1 : y1 + halfGap
        const adjustedY2 = r === allHorizontal.length - 2 ? y2 : y2 - halfGap
        
        coordinates.push({
          x: adjustedX1,
          y: adjustedY1,
          width: Math.max(1, adjustedX2 - adjustedX1),
          height: Math.max(1, adjustedY2 - adjustedY1)
        })
      }
    }
    
    return coordinates
  }, [image, horizontalLines, verticalLines, gap])

  const generatePreviews = useCallback(() => {
    if (!image) return

    const coordinates = getSliceCoordinates()
    const previews: SlicePreview[] = []

    coordinates.forEach((coord, index) => {
      const canvas = document.createElement("canvas")
      canvas.width = coord.width
      canvas.height = coord.height
      const ctx = canvas.getContext("2d")
      
      if (ctx) {
        ctx.drawImage(
          image,
          coord.x, coord.y, coord.width, coord.height,
          0, 0, coord.width, coord.height
        )
        previews.push({
          id: index,
          dataUrl: canvas.toDataURL("image/png")
        })
      }
    })

    setSlicePreviews(previews)
  }, [image, getSliceCoordinates])

  const handleDownloadZip = async () => {
    if (!image || slicePreviews.length === 0) return

    setIsProcessing(true)
    
    try {
      const zip = new JSZip()
      const coordinates = getSliceCoordinates()

      for (let i = 0; i < coordinates.length; i++) {
        const coord = coordinates[i]
        const canvas = document.createElement("canvas")
        canvas.width = coord.width
        canvas.height = coord.height
        const ctx = canvas.getContext("2d")
        
        if (ctx) {
          ctx.drawImage(
            image,
            coord.x, coord.y, coord.width, coord.height,
            0, 0, coord.width, coord.height
          )
          
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png")
          })
          
          const row = Math.floor(i / columns) + 1
          const col = (i % columns) + 1
          zip.file(`slice_${row}_${col}.png`, blob)
        }
      }

      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, "XiaomaAI_Slices.zip")
    } catch (error) {
      console.error("打包失败:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleHorizontalLineDrag = (index: number, newY: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const percentage = Math.max(5, Math.min(95, ((newY - rect.top) / rect.height) * 100))
    
    setHorizontalLines(prev => {
      const newLines = [...prev]
      newLines[index] = percentage
      return newLines
    })
  }

  const handleVerticalLineDrag = (index: number, newX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const percentage = Math.max(5, Math.min(95, ((newX - rect.left) / rect.width) * 100))
    
    setVerticalLines(prev => {
      const newLines = [...prev]
      newLines[index] = percentage
      return newLines
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            AI 漫剧可视化切图工作台
          </h1>
          <p className="text-slate-400 text-sm">Visual Grid Slicer - 拖拽辅助线精准切割</p>
        </div>

        {/* 顶部控制面板 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-4 md:gap-8">
            {/* 行数控制 */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400 whitespace-nowrap">行数</label>
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setRows(Math.max(1, rows - 1))}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors text-cyan-400"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 bg-transparent text-center text-cyan-400 font-mono text-lg focus:outline-none"
                  min={1}
                />
                <button
                  onClick={() => setRows(rows + 1)}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors text-cyan-400"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* 列数控制 */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400 whitespace-nowrap">列数</label>
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setColumns(Math.max(1, columns - 1))}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors text-purple-400"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={columns}
                  onChange={(e) => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 bg-transparent text-center text-purple-400 font-mono text-lg focus:outline-none"
                  min={1}
                />
                <button
                  onClick={() => setColumns(columns + 1)}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors text-purple-400"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* 缝隙控制 */}
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <label className="text-sm text-slate-400 whitespace-nowrap">去除白边</label>
              <input
                type="range"
                min={0}
                max={50}
                value={gap}
                onChange={(e) => setGap(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-cyan-400 font-mono text-sm w-12">{gap}px</span>
            </div>

            {/* 下载按钮 */}
            <button
              onClick={handleDownloadZip}
              disabled={!image || isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/20"
            >
              <Package size={18} />
              <span>{isProcessing ? "打包中..." : "智能切割并打包下载 (ZIP)"}</span>
            </button>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：裁剪画板 */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-300">可视化裁剪画板</h2>
                {image && (
                  <button
                    onClick={clearImage}
                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                    清除图片
                  </button>
                )}
              </div>

              {!image ? (
                <label className="flex flex-col items-center justify-center h-[400px] md:h-[500px] border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-colors bg-slate-900/30">
                  <Upload size={48} className="text-slate-600 mb-4" />
                  <span className="text-slate-400 mb-2">点击或拖拽上传图片</span>
                  <span className="text-slate-500 text-sm">支持 PNG, JPG, WEBP</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div
                  ref={containerRef}
                  className="relative h-[400px] md:h-[500px] bg-slate-900/80 rounded-xl overflow-hidden"
                >
                  {/* 图片 */}
                  <img
                    src={imageSrc}
                    alt="待切割图片"
                    className="absolute inset-0 w-full h-full object-contain"
                  />

                  {/* 水平辅助线 */}
                  {horizontalLines.map((pos, index) => (
                    <motion.div
                      key={`h-${index}`}
                      className="absolute left-0 right-0 cursor-ns-resize group"
                      style={{ top: `${pos}%` }}
                      drag="y"
                      dragMomentum={false}
                      dragElastic={0}
                      onDrag={(_, info) => {
                        handleHorizontalLineDrag(index, info.point.y)
                      }}
                    >
                      {/* Gap 区域显示 */}
                      {gap > 0 && (
                        <div
                          className="absolute left-0 right-0 bg-red-500/20 border-y border-red-500/40"
                          style={{
                            height: `${gap}px`,
                            top: `-${gap / 2}px`
                          }}
                        />
                      )}
                      {/* 主线 */}
                      <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                      {/* 拖拽手柄 */}
                      <div className="absolute left-1/2 -translate-x-1/2 -top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-cyan-500 rounded px-2 py-1 flex items-center gap-1">
                          <GripVertical size={12} />
                          <span className="text-xs">{pos.toFixed(1)}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* 垂直辅助线 */}
                  {verticalLines.map((pos, index) => (
                    <motion.div
                      key={`v-${index}`}
                      className="absolute top-0 bottom-0 cursor-ew-resize group"
                      style={{ left: `${pos}%` }}
                      drag="x"
                      dragMomentum={false}
                      dragElastic={0}
                      onDrag={(_, info) => {
                        handleVerticalLineDrag(index, info.point.x)
                      }}
                    >
                      {/* Gap 区域显示 */}
                      {gap > 0 && (
                        <div
                          className="absolute top-0 bottom-0 bg-red-500/20 border-x border-red-500/40"
                          style={{
                            width: `${gap}px`,
                            left: `-${gap / 2}px`
                          }}
                        />
                      )}
                      {/* 主线 */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-purple-500 shadow-lg shadow-purple-500/50" />
                      {/* 拖拽手柄 */}
                      <div className="absolute top-1/2 -translate-y-1/2 -left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-purple-500 rounded px-2 py-1 flex items-center gap-1">
                          <GripVertical size={12} className="rotate-90" />
                          <span className="text-xs">{pos.toFixed(1)}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* 网格信息 */}
                  <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg text-sm">
                    <span className="text-cyan-400">{rows}</span>
                    <span className="text-slate-500"> × </span>
                    <span className="text-purple-400">{columns}</span>
                    <span className="text-slate-500"> = </span>
                    <span className="text-white font-medium">{rows * columns} 格</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：预览画廊 */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 h-full">
              <h2 className="text-lg font-semibold text-slate-300 mb-4">
                实时预览
                {slicePreviews.length > 0 && (
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({slicePreviews.length} 张)
                  </span>
                )}
              </h2>

              {slicePreviews.length === 0 ? (
                <div className="flex items-center justify-center h-[400px] text-slate-600 text-sm">
                  上传图片后显示切片预览
                </div>
              ) : (
                <div
                  className="grid gap-2 max-h-[500px] overflow-y-auto pr-2"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(columns, 4)}, minmax(0, 1fr))`
                  }}
                >
                  {slicePreviews.map((preview, index) => (
                    <div
                      key={preview.id}
                      className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-500/50 transition-colors group"
                    >
                      <img
                        src={preview.dataUrl}
                        alt={`切片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                        <span className="text-xs font-mono">
                          {Math.floor(index / columns) + 1}-{(index % columns) + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
