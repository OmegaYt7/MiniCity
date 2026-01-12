
import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { TILE_SIZE, COLORS, BUILDINGS, MIN_ZOOM, MAX_ZOOM } from '../constants';
import { TileType, BuildingCategory } from '../types';

interface WorldMapProps {
  onInteract: () => void;
}

// Helper: Deterministic pseudo-random for stable lighting
const pseudoRandom = (x: number, y: number, seed: number) => {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453123;
    return n - Math.floor(n);
};

const drawBuildingDetails = (ctx: CanvasRenderingContext2D, def: any, x: number, y: number, w: number, h: number, isNight: boolean, worldX: number, worldY: number) => {
    if (!def) return;
    
    // Windows logic
    if (def.category === BuildingCategory.RESIDENTIAL || def.category === BuildingCategory.COMMERCIAL || def.category === BuildingCategory.INDUSTRIAL) {
        const rows = Math.floor(h / 15);
        const cols = Math.floor(w / 15);
        if (rows <= 0 || cols <= 0) return;

        const pad = 4;
        const winW = (w - (cols+1)*pad) / cols;
        const winH = (h - (rows+1)*pad) / rows;
        
        if (winW <= 0 || winH <= 0) return;

        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                // Stable night lighting
                const seed = (worldX + c) * 100 + (worldY + r);
                const isLit = isNight && (pseudoRandom(seed, 0, def.price) > 0.4); 
                
                ctx.fillStyle = isLit ? '#fef08a' : '#1e293b'; 
                if (!isNight) ctx.fillStyle = '#334155'; // Dark blue/gray day windows

                ctx.fillRect(x + pad + c*(winW+pad), y + pad + r*(winH+pad), winW, winH);
            }
        }
    }
    
    // Roof Features (Industrial)
    if (def.category === BuildingCategory.INDUSTRIAL) {
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(x + w - 10, y + 10, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(x + w - 10, y + 10, 3, 0, Math.PI*2);
        ctx.fill();
    }
    
    // AC Unit (Residential)
    if (def.category === BuildingCategory.RESIDENTIAL) {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x + 5, y + 5, 10, 6);
    }
};

const WorldMap: React.FC<WorldMapProps> = ({ onInteract }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { mapData, buildings, effects, mode, selectedBuildingDef, movingInstanceId, actions, timeOfDay } = useGame();
  
  const [camera, setCamera] = useState({ 
    x: -(mapData.width * TILE_SIZE) / 2 + window.innerWidth / 2, 
    y: -(mapData.height * TILE_SIZE) / 2 + window.innerHeight / 2, 
    zoom: 0.8 
  });
  
  const activePointers = useRef<Map<number, {x: number, y: number}>>(new Map());
  const prevPinchInfo = useRef<{dist: number, center: {x: number, y: number}} | null>(null);
  const isDragging = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 }); 
  const [hoverTile, setHoverTile] = useState({ x: -1, y: -1 });

  const getAmbientColor = (hour: number) => {
    if (hour >= 20 || hour < 5) return { r: 10, g: 15, b: 40, a: 0.6 }; 
    if (hour >= 8 && hour < 17) return { r: 255, g: 255, b: 255, a: 0 }; 
    
    if (hour >= 5 && hour < 8) {
        const t = (hour - 5) / 3; 
        return { r: 10 + t*20, g: 15 + t*20, b: 40 + t*10, a: 0.6 * (1-t) };
    }
    if (hour >= 17 && hour < 20) {
        const t = (hour - 17) / 3;
        return { r: 255 - t*200, g: 150 - t*100, b: 50, a: t * 0.5 };
    }
    return { r: 0, g: 0, b: 0, a: 0 };
  };

  const isNight = timeOfDay >= 19 || timeOfDay < 6;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // CLEAR
      ctx.fillStyle = COLORS.WATER;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      try {
          ctx.translate(camera.x, camera.y);
          ctx.scale(camera.zoom, camera.zoom);

          // Map Bounds
          const startCol = Math.floor((-camera.x / camera.zoom) / TILE_SIZE);
          const endCol = startCol + (canvas.width / camera.zoom) / TILE_SIZE + 1;
          const startRow = Math.floor((-camera.y / camera.zoom) / TILE_SIZE);
          const endRow = startRow + (canvas.height / camera.zoom) / TILE_SIZE + 1;

          const startX = Math.max(0, startCol);
          const startY = Math.max(0, startRow);
          const endX = Math.min(mapData.width, endCol);
          const endY = Math.min(mapData.height, endRow);

          // 2. Tiles
          for (let y = startY; y < endY; y++) {
            if (!mapData.tiles[y]) continue;
            for (let x = startX; x < endX; x++) {
              const tile = mapData.tiles[y][x];
              const posX = x * TILE_SIZE;
              const posY = y * TILE_SIZE;

              if (tile === TileType.GRASS) {
                ctx.fillStyle = COLORS.GRASS;
                ctx.fillRect(posX, posY, TILE_SIZE + 1, TILE_SIZE + 1);
              } else if (tile === TileType.SAND) {
                ctx.fillStyle = COLORS.SAND;
                ctx.fillRect(posX, posY, TILE_SIZE + 1, TILE_SIZE + 1);
              } else if (tile === TileType.ROAD) {
                ctx.fillStyle = COLORS.ROAD; 
                ctx.fillRect(posX, posY, TILE_SIZE + 1, TILE_SIZE + 1);
                
                // Road Markings
                ctx.fillStyle = COLORS.ROAD_MARKING;
                const neighborRight = mapData.tiles[y][x+1] === TileType.ROAD;
                const neighborBottom = mapData.tiles[y+1]?.[x] === TileType.ROAD;
                const neighborLeft = mapData.tiles[y][x-1] === TileType.ROAD;
                const neighborTop = mapData.tiles[y-1]?.[x] === TileType.ROAD;
                
                const centerX = posX + TILE_SIZE/2;
                const centerY = posY + TILE_SIZE/2;
                
                ctx.globalAlpha = 0.5;
                if (neighborLeft || neighborRight) {
                     const start = neighborLeft ? posX : centerX - 6;
                     const end = neighborRight ? posX + TILE_SIZE : centerX + 6;
                     ctx.fillRect(start, centerY - 2, end - start, 4);
                }
                if (neighborTop || neighborBottom) {
                     const start = neighborTop ? posY : centerY - 6;
                     const end = neighborBottom ? posY + TILE_SIZE : centerY + 6;
                     ctx.fillRect(centerX - 2, start, 4, end - start);
                }
                if (!neighborLeft && !neighborRight && !neighborTop && !neighborBottom) {
                     ctx.fillRect(centerX - 3, centerY - 3, 6, 6);
                }
                ctx.globalAlpha = 1.0;
              }
            }
          }

          // 3. Decorations
          mapData.decorations.forEach(d => {
            if(d.x < startX || d.x > endX || d.y < startY || d.y > endY) return;

            const px = d.x * TILE_SIZE + TILE_SIZE/2;
            const py = d.y * TILE_SIZE + TILE_SIZE/2;
            
            if (d.type === 'TREE') {
                ctx.fillStyle = '#14532d';
                ctx.beginPath();
                ctx.arc(px, py + 5, TILE_SIZE * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#16a34a';
                ctx.beginPath();
                ctx.arc(px, py - 5, TILE_SIZE * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#4ade80';
                ctx.beginPath();
                ctx.arc(px - 5, py - 10, TILE_SIZE * 0.15, 0, Math.PI * 2);
                ctx.fill();
            } else if (d.type === 'ROCK') {
                ctx.fillStyle = '#475569';
                ctx.beginPath();
                ctx.ellipse(px, py + 10, 12, 8, 0, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = '#94a3b8';
                ctx.beginPath();
                ctx.ellipse(px - 2, py + 8, 8, 5, 0, 0, Math.PI*2);
                ctx.fill();
            } else if (d.type === 'BUSH') {
                 ctx.fillStyle = '#166534';
                 ctx.beginPath();
                 ctx.arc(px + 5, py + 5, 10, 0, Math.PI * 2);
                 ctx.arc(px - 5, py + 5, 9, 0, Math.PI * 2);
                 ctx.arc(px, py - 2, 10, 0, Math.PI * 2);
                 ctx.fill();
            }
          });

          // 4. Buildings
          // Use safe slice to avoid mutating original state in sort (though sort is in-place, mapData buildings from context might be read-only frozen in strict mode)
          const sortedBuildings = [...buildings].sort((a, b) => a.y - b.y);
          
          sortedBuildings.forEach(b => {
            if (b.id === movingInstanceId) return;

            const def = BUILDINGS.find(d => d.id === b.defId);
            if (!def) return;
            
            const px = b.x * TILE_SIZE;
            const py = b.y * TILE_SIZE;
            const w = def.width * TILE_SIZE;
            const h = def.height * TILE_SIZE;

            // Check viewport visibility roughly
            if (px + w < (-camera.x/camera.zoom) || px > (-camera.x/camera.zoom) + (canvas.width/camera.zoom)) return;
            if (py + h < (-camera.y/camera.zoom) || py > (-camera.y/camera.zoom) + (canvas.height/camera.zoom)) return;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(px + w/2, py + h - 5, w/2 - 5, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            const levelHeight = (b.level - 1) * 8;
            const baseDepth = 20;
            const depth = baseDepth + levelHeight; 
            
            // Draw Body
            ctx.fillStyle = def.imageColor; 
            // Darker side
            ctx.fillStyle = adjustColor(def.imageColor, -40);
            ctx.fillRect(px + 4, py + 4, w - 8, h - 8); 
            // Main face
            ctx.fillStyle = def.imageColor;
            ctx.fillRect(px + 4, py + 4 - depth, w - 8, h - 8);
            
            // 3D Side shading
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(px + 4, py + 4 - depth, 4, h - 8); // Left shade
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(px + 4, py + 4 - depth, w - 8, 4); // Top highlight

            // Details
            drawBuildingDetails(ctx, def, px + 4, py + 4 - depth, w - 8, h - 8, isNight, b.x, b.y);

            // Level Stars
            if (camera.zoom > 0.6 && b.level > 1) {
                ctx.fillStyle = '#fbbf24';
                const spacing = 10;
                const totalW = (b.level - 1) * spacing;
                const startX = px + w/2 - totalW/2;
                for(let i=0; i<b.level; i++) {
                    ctx.beginPath();
                    ctx.arc(startX + i*spacing - spacing/2, py - depth - 12, 3, 0, Math.PI*2);
                    ctx.fill();
                }
            }
          });

          // 5. Destruction Effects
          const now = Date.now();
          effects.forEach(eff => {
             const elapsed = now - eff.startTime;
             const duration = 800;
             if (elapsed < duration) {
                 const progress = elapsed / duration;
                 const px = eff.x * TILE_SIZE;
                 const py = eff.y * TILE_SIZE;
                 
                 const scale = 1 - progress;
                 const alpha = 1 - progress;
                 
                 ctx.save();
                 ctx.globalAlpha = alpha;
                 ctx.translate(px + TILE_SIZE/2, py + TILE_SIZE/2);
                 ctx.scale(scale, scale);
                 
                 ctx.fillStyle = '#94a3b8';
                 ctx.beginPath();
                 ctx.arc(0, 0, TILE_SIZE * 0.8, 0, Math.PI * 2);
                 ctx.fill();
                 
                 for(let i=0; i<8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + progress * 2;
                    const dist = progress * TILE_SIZE * 1.5;
                    const size = (1-progress) * 10;
                    ctx.fillStyle = i % 2 === 0 ? '#475569' : '#cbd5e1';
                    ctx.beginPath();
                    ctx.arc(Math.cos(angle)*dist, Math.sin(angle)*dist, size, 0, Math.PI*2);
                    ctx.fill();
                 }
                 ctx.restore();
             }
          });

          // 6. Day/Night Overlay
          const ambient = getAmbientColor(timeOfDay);
          if (ambient.a > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(${ambient.r}, ${ambient.g}, ${ambient.b}, ${ambient.a})`;
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillRect(-camera.x/camera.zoom, -camera.y/camera.zoom, canvas.width/camera.zoom, canvas.height/camera.zoom);
            ctx.restore();
          }

          // 7. Light Sources
          if (isNight) {
              ctx.save();
              ctx.globalCompositeOperation = 'screen';
              buildings.forEach(b => {
                 const def = BUILDINGS.find(d => d.id === b.defId);
                 if (def && def.lightRadius && b.id !== movingInstanceId) {
                     const cx = (b.x + def.width/2) * TILE_SIZE;
                     const cy = (b.y + def.height/2) * TILE_SIZE;
                     const r = def.lightRadius * TILE_SIZE;
                     
                     const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
                     // Reduced opacity for subtle "lamp" look
                     g.addColorStop(0, def.lightColor ? def.lightColor.replace('1.0', '0.25') : 'rgba(255,255,200,0.25)'); 
                     g.addColorStop(1, 'rgba(0,0,0,0)');
                     
                     ctx.fillStyle = g;
                     ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
                 }
              });
              ctx.restore();
          }

          // 8. Ghost Building
          if (mode === 'PLACING' && selectedBuildingDef && hoverTile.x >= 0) {
             const def = selectedBuildingDef;
             const gx = hoverTile.x;
             const gy = hoverTile.y;
             
             const px = gx * TILE_SIZE;
             const py = gy * TILE_SIZE;
             const w = def.width * TILE_SIZE;
             const h = def.height * TILE_SIZE;

             let valid = true;
             if (gx < 0 || gy < 0 || gx + def.width > mapData.width || gy + def.height > mapData.height) valid = false;
             else {
                 for(let i=0; i<def.width; i++) {
                    for(let j=0; j<def.height; j++) {
                        const tile = mapData.tiles[gy+j]?.[gx+i];
                        if (tile !== TileType.GRASS && tile !== TileType.SAND) valid = false;
                    }
                }
                buildings.forEach(b => {
                    if(b.id === movingInstanceId) return;
                    const bDef = BUILDINGS.find(d => d.id === b.defId)!;
                    if (gx < b.x + bDef.width && gx + def.width > b.x && gy < b.y + bDef.height && gy + def.height > b.y) valid = false;
                });
             }

             ctx.globalAlpha = 0.7;
             ctx.fillStyle = valid ? def.imageColor : COLORS.HIGHLIGHT_INVALID;
             const depth = 20;
             ctx.fillRect(px + 4, py + 4 - depth, w - 8, h - 8);
             
             ctx.globalAlpha = 0.4;
             ctx.fillStyle = valid ? COLORS.HIGHLIGHT_VALID : COLORS.HIGHLIGHT_INVALID;
             ctx.fillRect(px, py, w, h);
             ctx.globalAlpha = 1.0;
          }

      } catch (err) {
          console.error("Render error:", err);
      } finally {
          ctx.restore(); // Matches the first save
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [mapData, buildings, effects, camera, mode, selectedBuildingDef, hoverTile, movingInstanceId, timeOfDay]);

  // Color helper logic (placeholder)
  function adjustColor(color: string, amount: number) { return color; }

  // Logic
  const screenToWorld = (sx: number, sy: number) => ({
    x: (sx - camera.x) / camera.zoom,
    y: (sy - camera.y) / camera.zoom,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    canvasRef.current?.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (activePointers.current.size === 1) {
        onInteract();
        isDragging.current = false;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
    } 
    else if (activePointers.current.size === 2) {
        isDragging.current = false;
        const points = Array.from(activePointers.current.values()) as {x: number, y: number}[];
        prevPinchInfo.current = {
            dist: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
            center: { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
        };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointers.current.size === 2) {
        const points = Array.from(activePointers.current.values()) as {x: number, y: number}[];
        const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        const center = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };

        if (prevPinchInfo.current) {
            const oldDist = prevPinchInfo.current.dist;
            if (oldDist > 10 && dist > 10) {
                const zoomRatio = dist / oldDist;
                setCamera(prev => {
                    let newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * zoomRatio));
                    const effectiveRatio = newZoom / prev.zoom;
                    const newX = center.x - (prevPinchInfo.current!.center.x - prev.x) * effectiveRatio;
                    const newY = center.y - (prevPinchInfo.current!.center.y - prev.y) * effectiveRatio;
                    return { x: newX, y: newY, zoom: newZoom };
                });
            }
        }
        prevPinchInfo.current = { dist, center };
        return;
    }

    if (activePointers.current.size === 1 && e.isPrimary) {
        const dx = e.clientX - lastPanPos.current.x;
        const dy = e.clientY - lastPanPos.current.y;
        
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) isDragging.current = true;

        if (isDragging.current) {
            setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            lastPanPos.current = { x: e.clientX, y: e.clientY };
        }

        if (mode === 'PLACING') {
            const worldPos = screenToWorld(e.clientX, e.clientY);
            const tx = Math.floor(worldPos.x / TILE_SIZE);
            const ty = Math.floor(worldPos.y / TILE_SIZE);
            setHoverTile({ x: tx, y: ty });
        }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    canvasRef.current?.releasePointerCapture(e.pointerId);
    activePointers.current.delete(e.pointerId);
    
    if (activePointers.current.size < 2) prevPinchInfo.current = null;
    if (activePointers.current.size === 1) {
        const p = activePointers.current.values().next().value;
        if (p) lastPanPos.current = { x: p.x, y: p.y };
    }

    if (!isDragging.current && activePointers.current.size === 0) {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        const tx = Math.floor(worldPos.x / TILE_SIZE);
        const ty = Math.floor(worldPos.y / TILE_SIZE);

        if (mode === 'PLACING' && selectedBuildingDef) {
            const success = actions.placeBuilding(selectedBuildingDef, tx, ty);
            if (success) { 
                actions.setMode('VIEW');
                actions.selectBuildingDef(null);
            }
        } else if (mode === 'VIEW' || mode === 'INSPECT') {
            const clickedBuilding = [...buildings].reverse().find(b => {
                const def = BUILDINGS.find(d => d.id === b.defId)!;
                return (tx >= b.x && tx < b.x + def.width && ty >= b.y && ty < b.y + def.height);
            });
            actions.selectInstance(clickedBuilding || null);
        }
    }
    
    if (activePointers.current.size === 0) isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const { clientX, clientY, deltaY } = e;
    setCamera(prev => {
        const scaleAmount = -deltaY * 0.001; 
        let newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * (1 + scaleAmount)));
        const zoomRatio = newZoom / prev.zoom;
        const newX = clientX - (clientX - prev.x) * zoomRatio;
        const newY = clientY - (clientY - prev.y) * zoomRatio;
        return { x: newX, y: newY, zoom: newZoom };
    });
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 touch-none cursor-move"
      width={window.innerWidth}
      height={window.innerHeight}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

export default WorldMap;
