
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Point, Hotspot, Photo360 } from '../types';
import { MousePointer2, Move, Trash2, Plus, RefreshCcw } from 'lucide-react';

interface FloorPlanDesignerProps {
  points: Point[];
  hotspots: Hotspot[];
  photos: Photo360[];
  onUpdatePoints: (points: Point[]) => void;
  onUpdateHotspots: (hotspots: Hotspot[]) => void;
  isReadOnly?: boolean;
  activeHotspotId?: string;
  onSelectHotspot?: (id: string) => void;
}

const FloorPlanDesigner: React.FC<FloorPlanDesignerProps> = ({
  points,
  hotspots,
  photos,
  onUpdatePoints,
  onUpdateHotspots,
  isReadOnly = false,
  activeHotspotId,
  onSelectHotspot
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'draw' | 'place'>('draw');
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const [draggedHotspotId, setDraggedHotspotId] = useState<string | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ index: number; x: number; y: number } | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const getDistToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
    if (l2 === 0) return { dist: Math.hypot(px - x1, py - y1), x: x1, y: y1 };
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const nearestX = x1 + t * (x2 - x1);
    const nearestY = y1 + t * (y2 - y1);
    return { dist: Math.hypot(px - nearestX, py - nearestY), x: nearestX, y: nearestY };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftPressed(true); };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftPressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getCanvasCoords = (e: React.PointerEvent | PointerEvent | React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 25) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 25) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // 2. Floor Plan Polygon
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      if (points.length > 2) ctx.closePath();
      
      ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
      ctx.fill();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      if (!isReadOnly) {
        points.forEach((p, idx) => {
          const isHovered = hoveredPointIndex === idx;
          const isDragged = draggedPointIndex === idx;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (isHovered || isDragged) ? 9 : 6, 0, Math.PI * 2);
          ctx.fillStyle = isDragged ? '#1d4ed8' : (isHovered ? '#2563eb' : '#3b82f6');
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        if (mode === 'draw' && hoveredEdge && hoveredPointIndex === null && !draggedPointIndex) {
          ctx.beginPath();
          ctx.arc(hoveredEdge.x, hoveredEdge.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(37, 99, 235, 0.5)';
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }

    // 4. Hotspots (Tour Markers)
    hotspots.forEach(h => {
      const isActive = h.id === activeHotspotId;
      const isDragging = h.id === draggedHotspotId;
      const isHovered = h.id === hoveredHotspotId;
      
      const radius = (isDragging || isHovered) ? 18 : 15;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(h.position.x, h.position.y, radius, 0, Math.PI * 2);
      ctx.shadowBlur = (isActive || isHovered) ? 12 : 4;
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.fillStyle = isActive ? '#ef4444' : '#10b981';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = 'white';
      ctx.fillRect(h.position.x - 5, h.position.y - 3, 10, 7);
      ctx.beginPath();
      ctx.arc(h.position.x, h.position.y + 0.5, 2, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#ef4444' : '#10b981';
      ctx.fill();
      
      const labelY = h.position.y + 35;
      ctx.font = '600 12px Inter';
      const metrics = ctx.measureText(h.label);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillRect(h.position.x - metrics.width/2 - 6, labelY - 10, metrics.width + 12, 16);
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText(h.label, h.position.x, labelY + 2);
    });
  }, [points, hotspots, isReadOnly, activeHotspotId, draggedPointIndex, draggedHotspotId, hoveredPointIndex, hoveredHotspotId, hoveredEdge, mode]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isReadOnly) return;
    const { x, y } = getCanvasCoords(e);
    
    if (mode === 'draw') {
      const pointIdx = points.findIndex(p => Math.hypot(p.x - x, p.y - y) < 15);
      if (pointIdx !== -1) {
        if (e.button === 2) {
          onUpdatePoints(points.filter((_, i) => i !== pointIdx));
        } else {
          setDraggedPointIndex(pointIdx);
        }
        return;
      }

      if (hoveredEdge && e.button === 0) {
        const newPoints = [...points];
        newPoints.splice(hoveredEdge.index + 1, 0, { x: hoveredEdge.x, y: hoveredEdge.y });
        onUpdatePoints(newPoints);
        setDraggedPointIndex(hoveredEdge.index + 1);
        return;
      }

      if (e.button === 0) {
        onUpdatePoints([...points, { x, y }]);
      }
    } else {
      const hotspotIdx = hotspots.findIndex(h => Math.hypot(h.position.x - x, h.position.y - y) < 20);
      if (hotspotIdx !== -1) {
        if (e.button === 2) {
          onUpdateHotspots(hotspots.filter((_, i) => i !== hotspotIdx));
        } else {
          setDraggedHotspotId(hotspots[hotspotIdx].id);
          onSelectHotspot?.(hotspots[hotspotIdx].id);
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isReadOnly) return;
    let { x, y } = getCanvasCoords(e);

    if (draggedPointIndex === null && draggedHotspotId === null) {
      if (mode === 'draw') {
        const pIdx = points.findIndex(p => Math.hypot(p.x - x, p.y - y) < 15);
        setHoveredPointIndex(pIdx !== -1 ? pIdx : null);

        if (pIdx === -1 && points.length > 1) {
          let foundEdge = null;
          for (let i = 0; i < points.length; i++) {
            const nextIdx = (i + 1) % points.length;
            if (nextIdx === 0 && points.length <= 2) continue;
            
            const p1 = points[i];
            const p2 = points[nextIdx];
            const result = getDistToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
            if (result.dist < 10) {
              foundEdge = { index: i, x: result.x, y: result.y };
              break;
            }
          }
          setHoveredEdge(foundEdge);
        } else {
          setHoveredEdge(null);
        }
      } else {
        const hIdx = hotspots.findIndex(h => Math.hypot(h.position.x - x, h.position.y - y) < 20);
        setHoveredHotspotId(hIdx !== -1 ? hotspots[hIdx].id : null);
      }
    }

    if (draggedPointIndex !== null) {
      if (isShiftPressed) {
        let snapX = x;
        let snapY = y;
        let minThreshold = 15;
        points.forEach((p, idx) => {
          if (idx === draggedPointIndex) return;
          if (Math.abs(x - p.x) < minThreshold) snapX = p.x;
          if (Math.abs(y - p.y) < minThreshold) snapY = p.y;
        });
        if (snapX === x && snapY === y) {
          const prevIdx = (draggedPointIndex - 1 + points.length) % points.length;
          const prevP = points[prevIdx];
          if (Math.abs(x - prevP.x) > Math.abs(y - prevP.y)) y = prevP.y;
          else x = prevP.x;
        } else {
          x = snapX;
          y = snapY;
        }
      }
      const newPoints = [...points];
      newPoints[draggedPointIndex] = { x, y };
      onUpdatePoints(newPoints);
    } else if (draggedHotspotId !== null) {
      const newHotspots = hotspots.map(h => 
        h.id === draggedHotspotId ? { ...h, position: { x, y } } : h
      );
      onUpdateHotspots(newHotspots);
    }
  };

  const handlePointerUp = () => {
    setDraggedPointIndex(null);
    setDraggedHotspotId(null);
  };

  const handleAddMarker = (e: React.MouseEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      alert("Please upload at least one 360 photo first in the '360 Photos' tab!");
      return;
    }
    const newId = `spot_${Math.random().toString(36).substr(2, 9)}`;
    const newHotspot: Hotspot = {
      id: newId,
      photoId: photos[0].id,
      position: { x: 300, y: 200 },
      label: 'Unnamed Spot'
    };
    setMode('place');
    onUpdateHotspots([...hotspots, newHotspot]);
    setTimeout(() => onSelectHotspot?.(newId), 100);
  };

  return (
    <div className="flex flex-col gap-4 select-none max-w-full">
      {!isReadOnly && (
        <div className="flex flex-wrap items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm gap-2">
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => { setMode('draw'); onSelectHotspot?.(''); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${mode === 'draw' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <MousePointer2 size={14} /> Draw
            </button>
            <button 
              type="button"
              onClick={() => setMode('place')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${mode === 'place' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <Move size={14} /> Move
            </button>
            <button 
              type="button"
              onClick={handleAddMarker}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              <Plus size={14} /> Marker
            </button>
          </div>
          <button 
            type="button"
            onClick={() => { if(confirm("Clear plan?")) { onUpdatePoints([]); onUpdateHotspots([]); } }}
            className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded uppercase"
          >
            Reset
          </button>
        </div>
      )}

      <div className="relative border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-inner group w-full flex justify-center items-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          onClick={(e) => {
            if (isReadOnly) {
              const { x, y } = getCanvasCoords(e);
              const clickedHotspot = hotspots.find(h => Math.hypot(h.position.x - x, h.position.y - y) < 25);
              if (clickedHotspot) onSelectHotspot?.(clickedHotspot.id);
            }
          }}
          style={{ touchAction: 'none' }}
          className={`max-w-full block h-auto transition-colors duration-300 ${isReadOnly ? 'cursor-pointer' : (mode === 'draw' ? 'cursor-crosshair' : 'cursor-move')}`}
        />
        
        {!isReadOnly && activeHotspotId && (
          <div className="absolute inset-x-0 bottom-0 md:top-4 md:bottom-auto md:right-4 md:inset-x-auto p-4 bg-white/95 backdrop-blur-xl border-t md:border border-slate-200 md:rounded-2xl shadow-2xl md:w-64 animate-in slide-in-from-bottom md:slide-in-from-right-4 duration-300 z-50">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Edit Marker</div>
              <button onClick={() => onSelectHotspot?.('')} className="text-slate-400 hover:text-slate-600 p-1"><Plus size={16} className="rotate-45" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-tight">360 View</label>
                <select 
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-900 outline-none"
                  value={hotspots.find(h => h.id === activeHotspotId)?.photoId}
                  onChange={(e) => {
                    onUpdateHotspots(hotspots.map(h => h.id === activeHotspotId ? { ...h, photoId: e.target.value } : h));
                  }}
                >
                  {photos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-tight">Label</label>
                <input 
                  type="text"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-900 outline-none"
                  value={hotspots.find(h => h.id === activeHotspotId)?.label || ''}
                  onChange={(e) => {
                    onUpdateHotspots(hotspots.map(h => h.id === activeHotspotId ? { ...h, label: e.target.value } : h));
                  }}
                />
              </div>
              <button 
                type="button"
                onClick={() => {
                  onUpdateHotspots(hotspots.filter(h => h.id !== activeHotspotId));
                  onSelectHotspot?.('');
                }}
                className="w-full py-2 text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition uppercase tracking-widest"
              >
                Delete Marker
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorPlanDesigner;
