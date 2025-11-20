import { useState, useRef } from 'react';

export const useMapInteraction = () => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    isDragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging.current) return;

    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;

    last.current = { x: e.clientX, y: e.clientY };

    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;

    setScale((s) => Math.min(4, Math.max(0.4, s * zoom)));
  };

  const zoomIn = () => setScale(s => Math.min(s * 1.5, 5));
  const zoomOut = () => setScale(s => Math.max(s / 1.5, 0.5));
  const resetZoom = () => setScale(1);

  return {
    scale,
    pan,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    zoomIn,
    zoomOut,
    resetZoom
  };
};
