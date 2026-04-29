import { useRef, useEffect } from "react";
import { toGray } from "../utils/image-processing";

// ═══════════════════════════════════════════════
//  HISTOGRAM COMPONENT
// ═══════════════════════════════════════════════
export default function Histogram({ imgData }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!imgData || !ref.current) return;
    const { data } = imgData;
    const hist = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) hist[Math.round(toGray(data[i], data[i + 1], data[i + 2]))]++;
    const max = Math.max(...hist);
    const canvas = ref.current;
    const cw = canvas.offsetWidth || 800, ch = 56;
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);
    for (let i = 0; i < 256; i++) {
      const barH = Math.round((hist[i] / max) * (ch - 4));
      const hue = 190 + i * 0.35;
      ctx.fillStyle = `hsla(${hue},90%,55%,0.85)`;
      ctx.fillRect(Math.round(i * cw / 256), ch - barH, Math.ceil(cw / 256) + 1, barH);
    }
  }, [imgData]);
  return <canvas ref={ref} style={{ width: '100%', height: 56, display: 'block' }} />;
}

