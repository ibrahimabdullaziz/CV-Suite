"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import Histogram from "@/components/Histogram";
import Sidebar from "@/components/Sidebar";
import Toolbar from "@/components/Toolbar";
import ImageDisplay from "@/components/ImageDisplay";
import ParamControls from "@/components/ParamControls";
import { MENU } from "@/constants/menu";
import {
  meanFilter,
  gaussianFilter,
  midpointFilter,
  alphaTrimmedFilter,
  harmonicFilter,
  lowPassFilter,
  highPassFilter,
  medianFilter,
  modeFilter,
  maxFilter,
  minFilter,
  sobelFilter,
  prewittFilter,
  laplacianFilter,
  cannyFilter,
  otsuSegment,
  adaptiveSegment,
  regionGrowing,
  kMeansSegment,
  watershedSegment,
  padImage,
  rleAnalysis,
  huffmanAnalysis,
  lzwAnalysis,
} from "@/utils/image-processing";

export default function ImageProcessingSuite() {
  const [imgData, setImgData] = useState(null);
  const [imgDims, setImgDims] = useState(null);
  const [selected, setSelected] = useState(null);
  const [params, setParams] = useState({});
  const [compStats, setCompStats] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(
    "Drop an image or click Upload to begin",
  );
  const [elapsed, setElapsed] = useState(null);
  const [expandedCats, setExpandedCats] = useState({
    filters: true,
    segmentation: false,
    compression: false,
    padding: false,
  });
  const [expandedSubs, setExpandedSubs] = useState({});
  const [seedPoint, setSeedPoint] = useState(null);
  const [dragging, setDragging] = useState(false);

  const origRef = useRef(null);
  const procRef = useRef(null);
  const fileRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  useEffect(() => {
    if (imgData && origRef.current) {
      const oc = origRef.current;
      oc.width = imgData.width;
      oc.height = imgData.height;
      oc.getContext("2d").putImageData(imgData, 0, 0);

      const pc = procRef.current;
      if (pc) {
        pc.width = imgData.width;
        pc.height = imgData.height;
        pc.getContext("2d").clearRect(0, 0, imgData.width, imgData.height);
      }
    }
  }, [imgData]);

  const loadFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) {
      setStatus("Please upload a valid image file");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth,
        h = img.naturalHeight;
      const MAX = 640;
      if (w > MAX || h > MAX) {
        const s = Math.min(MAX / w, MAX / h);
        w = Math.round(w * s);
        h = Math.round(h * s);
      }
      const hc = hiddenCanvasRef.current;
      if (hc) {
        hc.width = w;
        hc.height = h;
        const ctx = hc.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const id = ctx.getImageData(0, 0, w, h);
        setImgData(id);
        setImgDims({ w, h });
        setCompStats(null);
        setSeedPoint(null);
        setElapsed(null);
        setSelected(null);
        setStatus(
          `Loaded: ${file.name} · ${w}×${h}px · ${(file.size / 1024).toFixed(0)}KB`,
        );
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const selectOp = (item) => {
    setSelected(item);
    setSeedPoint(null);
    setCompStats(null);
    setElapsed(null);
    const defs = {};
    item.params.forEach((p) => {
      defs[p.key] = p.def;
    });
    setParams(defs);
    setStatus(
      item.note ? `${item.label} — ${item.note}` : `Selected: ${item.label}`,
    );
  };

  const applyOp = useCallback(async () => {
    if (!imgData || !selected || processing) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 16));
    const t0 = performance.now();
    try {
      const p = params;
      let result = null;

      switch (selected.id) {
        case "mean":
          result = meanFilter(imgData, p.size || 3);
          break;
        case "gaussian":
          result = gaussianFilter(imgData, p.size || 5, p.sigma || 1.4);
          break;
        case "midpoint":
          result = midpointFilter(imgData, p.size || 3);
          break;
        case "alpha_trimmed":
          result = alphaTrimmedFilter(imgData, p.size || 3, p.d || 2);
          break;
        case "harmonic":
          result = harmonicFilter(imgData, p.size || 3);
          break;
        case "lowpass":
          result = lowPassFilter(imgData);
          break;
        case "highpass":
          result = highPassFilter(imgData);
          break;
        case "median":
          result = medianFilter(imgData, p.size || 3);
          break;
        case "mode":
          result = modeFilter(imgData, p.size || 3);
          break;
        case "max":
          result = maxFilter(imgData, p.size || 3);
          break;
        case "min":
          result = minFilter(imgData, p.size || 3);
          break;
        case "sobel":
          result = sobelFilter(imgData);
          break;
        case "prewitt":
          result = prewittFilter(imgData);
          break;
        case "laplacian":
          result = laplacianFilter(imgData);
          break;
        case "canny":
          result = cannyFilter(imgData, p.lo || 50, p.hi || 150);
          break;
        case "otsu":
          result = otsuSegment(imgData);
          break;
        case "adaptive":
          result = adaptiveSegment(imgData, p.blockSize || 15, p.C || 5);
          break;
        case "edge_seg":
          result = cannyFilter(imgData, 35, 90);
          break;
        case "region_grow": {
          const sx = seedPoint
            ? Math.round(seedPoint.x)
            : Math.floor(imgData.width / 2);
          const sy = seedPoint
            ? Math.round(seedPoint.y)
            : Math.floor(imgData.height / 2);
          result = regionGrowing(imgData, sx, sy, p.thresh || 30);
          break;
        }
        case "kmeans":
          result = kMeansSegment(imgData, p.k || 4);
          break;
        case "watershed":
          result = watershedSegment(imgData);
          break;
        case "rle": {
          setCompStats(rleAnalysis(imgData));
          setProcessing(false);
          return;
        }
        case "huffman": {
          setCompStats(huffmanAnalysis(imgData));
          setProcessing(false);
          return;
        }
        case "lzw": {
          setCompStats(lzwAnalysis(imgData));
          setProcessing(false);
          return;
        }
        default:
          if (selected.id.startsWith("pad_")) {
            const mode = selected.id.replace("pad_", "");
            result = padImage(imgData, p.size || 30, mode);
          }
      }

      if (result) {
        const pc = procRef.current;
        pc.width = result.width;
        pc.height = result.height;
        pc.getContext("2d").putImageData(result, 0, 0);
        const ms = (performance.now() - t0).toFixed(0);
        setElapsed(ms);
        setStatus(`✓ ${selected.label} applied in ${ms}ms`);
        setCompStats(null);
      }
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
    setProcessing(false);
  }, [imgData, selected, params, seedPoint, processing]);

  const handleCanvasClick = (e) => {
    if (selected?.id !== "region_grow" || !imgData) return;
    const rect = origRef.current.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (imgData.width / rect.width);
    const sy = (e.clientY - rect.top) * (imgData.height / rect.height);
    setSeedPoint({ x: sx, y: sy });
    setStatus(`Seed → (${Math.round(sx)}, ${Math.round(sy)}) · Click Apply`);
  };

  const downloadResult = () => {
    const pc = procRef.current;
    if (!pc.width) return;
    const a = document.createElement("a");
    a.href = pc.toDataURL("image/png");
    a.download = `cv-${selected?.id || "output"}.png`;
    a.click();
  };

  const toggleCat = (id) => setExpandedCats((e) => ({ ...e, [id]: !e[id] }));
  const toggleSub = (key) =>
    setExpandedSubs((e) => ({ ...e, [key]: e[key] === false ? true : false }));

  const catColor =
    MENU.find((c) =>
      c.subs.some((s) => s.items?.some((i) => i.id === selected?.id)),
    )?.color || "#00d4ff";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        background: "#060810",
        color: "#b0b8cc",
        overflow: "hidden",
        fontSize: 12,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Outfit:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: #0a0b14; } ::-webkit-scrollbar-thumb { background: #22253a; border-radius: 2px; }
        .mitem { cursor: pointer; padding: 5px 12px 5px 28px; color: #6870a0; transition: all 0.12s; border-left: 2px solid transparent; }
        .mitem:hover { color: #00d4ff; background: rgba(0,212,255,0.04); }
        .mitem.active { color: var(--ac); background: rgba(var(--acr),0.08); border-left-color: var(--ac); }
        .cat-hdr { display: flex; align-items: center; gap: 8px; padding: 8px 14px; cursor: pointer; color: #5060a0; font-size: 10px; letter-spacing: 0.12em; font-weight: 600; transition: color 0.15s; user-select: none; }
        .cat-hdr:hover { color: var(--ac); }
        .sub-hdr { padding: 4px 14px 4px 22px; font-size: 9px; color: #35405a; letter-spacing: 0.1em; cursor: pointer; display: flex; justify-content: space-between; user-select: none; }
        .sub-hdr:hover { color: #5060a0; }
        .apply-btn { background: transparent; border: 1px solid var(--ac); color: var(--ac); padding: 6px 20px; border-radius: 3px; cursor: pointer; font-family: inherit; font-size: 10px; letter-spacing: 0.1em; transition: all 0.15s; }
        .apply-btn:hover:not(:disabled) { background: var(--ac); color: #060810; }
        .apply-btn:disabled { opacity: 0.35; cursor: default; }
        .upload-btn { background: transparent; border: 1px solid #1e2236; color: #6870a0; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-family: inherit; font-size: 10px; letter-spacing: 0.08em; transition: all 0.15s; }
        .upload-btn:hover { border-color: #00d4ff; color: #00d4ff; }
        .drop-zone { border: 1px dashed #1a1e30; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .drop-zone:hover, .drop-zone.drag { border-color: #00d4ff; background: rgba(0,212,255,0.03); }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 2px; background: #1a1e30; border-radius: 2px; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; background: var(--ac); border-radius: 50%; cursor: pointer; }
        .stat-card { background: #0c0e1a; border: 1px solid #16192a; border-radius: 6px; padding: 10px 14px; }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        canvas { image-rendering: pixelated; }
      `}</style>

      <canvas ref={hiddenCanvasRef} style={{ display: "none" }} />

      <Sidebar
        selected={selected}
        selectOp={selectOp}
        expandedCats={expandedCats}
        toggleCat={toggleCat}
        expandedSubs={expandedSubs}
        toggleSub={toggleSub}
        status={status}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Toolbar
          imgDims={imgDims}
          selected={selected}
          catColor={catColor}
          elapsed={elapsed}
          processing={processing}
          applyOp={applyOp}
          downloadResult={downloadResult}
          fileRef={fileRef}
          loadFile={loadFile}
          imgData={imgData}
        />

        <ImageDisplay
          imgData={imgData}
          dragging={dragging}
          setDragging={setDragging}
          loadFile={loadFile}
          fileRef={fileRef}
          origRef={origRef}
          procRef={procRef}
          handleCanvasClick={handleCanvasClick}
          selected={selected}
          seedPoint={seedPoint}
          processing={processing}
          compStats={compStats}
          catColor={catColor}
        />

        <ParamControls
          selected={selected}
          params={params}
          setParams={setParams}
          catColor={catColor}
        />

        <div
          style={{
            height: 56,
            background: "#060810",
            borderTop: "1px solid #0e1020",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {imgData ? (
            <Histogram imgData={imgData} />
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                color: "#1e2236",
                letterSpacing: "0.1em",
              }}
            >
              HISTOGRAM
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
