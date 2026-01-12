
import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { TILE_SIZE, COLORS, BUILDINGS, MIN_ZOOM, MAX_ZOOM } from '../constants';
import { TileType, BuildingCategory } from '../types';

interface WorldMapProps {
  onInteract: () => void;
}

// Deterministic random for lighting consistency
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
        
        if (rows > 0 && cols > 0) {
            const pad = 4;
            const winW = (w - (cols+1)*pad) / cols;
            const winH = (h - (rows+1)*pad) / rows;
            
            if (winW > 0 && winH > 0) {
                // Randomly decide if this entire building has lights on tonight
                const buildingSeed = worldX * 100 + worldY;
                const buildingLit = pseudoRandom(buildingSeed, 0, 0) > 0.4; // 60% chance to be dark

                for(let r=0; r<rows; r++) {
                    for(let c=0; c<cols; c++) {
                        let isLit = false;
                        if (isNight && buildingLit) {
                             const winSeed = buildingSeed + c * 10 + r;
                             // Individual window variation if building is active
                             isLit = pseudoRandom(winSeed, 0, 0) > 0.3; 
                        }
                        
                        ctx.fillStyle = isLit ? '#fef08a' : '#1e293b'; 
                        if (!isNight) ctx.fillStyle = '#334155'; 

                        ctx.fillRect(x + pad + c*(winW+pad), y + pad + r*(winH+pad), winW, winH);
                    }
                }
            }
        }
    }
    
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
    
    if (def.category === BuildingCategory.RESIDENTIAL) {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x + 5, y + 5, 10, 6);
    }
};

const WorldMap: React.FC<WorldMapProps> = ({ onInteract }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { mapData, buildings, effects, mode, selectedBuildingDef, movingInstanceId, actions, timeOfDay, ghostPosition } = useGame();
  
  const [camera, setCamera] = useState({ 
    x: -(mapData.width * TILE_SIZE) / 2 + window.innerWidth / 2, 
    y: -(mapData.height * TILE_SIZE) / 2 + window.innerHeight / 2, 
    zoom: 0.8 
  });
  
  const activePointers = useRef<Map<number, {x: number, y: number}>>(new Map());
  const prevPinchInfo = useRef<{dist: number, center: {x: number, y: number}} | null>(null);
  const isDragging = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 }); 

  // Day/Night Cycle Phases
  // 0-6: Sunrise (Dark Blue to Orange)
  // 6-12: Day (Clear)
  // 12-18: Sunset (Clear to Orange/Purple)
  // 18-24: Night (Dark Blue)
  const getAmbientColor = (t: number) => {
    // Night (18-24 and 0-6 are handled by phases but simple logic below)
    
    if (t >= 0 && t < 6) { 
        // Sunrise: 0 (Night) -> 6 (Day)
        const p = t / 6; // 0 to 1
        // Start: 10, 15, 40, 0.6
        // End: 255, 200, 150, 0.0
        return { 
            r: 10 + p * (255-10), 
            g: 15 + p * (200-15), 
            b: 40 + p * (150-40), 
            a: 0.6 * (1-p)
        };
    }
    if (t >= 6 && t < 12) {
        // Day
        return { r: 255, g: 255, b: 255, a: 0 };
    }
    if (t >= 12 && t < 18) {
        // Sunset: 12 (Day) -> 18 (Night start)
        const p = (t - 12) / 6;
        return {
            r: 255, // Stay warm
            g: 255 - p * 150, 
            b: 255 - p * 200, 
            a: p * 0.5 
        };
    }
    // Night 18-24
    return { r: 10, g: 15, b: 40, a: 0.6 };
  };

  const isNight = timeOfDay >= 18 || timeOfDay < 6;

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

          // Tiles
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

          // Decorations
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
            } else if (d.type === 'ROCK') {
                ctx.fillStyle = '#475569';
                ctx.beginPath();
                ctx.ellipse(px, py + 10, 12, 8, 0, 0, Math.PI*2);
                ctx.fill();
            } else if (d.type === 'BUSH') {
                 ctx.fillStyle = '#166534';
                 ctx.beginPath();
                 ctx.arc(px, py + 2, 12, 0, Math.PI * 2);
                 ctx.fill();
            }
          });

          // Buildings
          const sortedBuildings = [...buildings].sort((a, b) => a.y - b.y);
          sortedBuildings.forEach(b => {
            if (b.id === movingInstanceId) return;
            const def = BUILDINGS.find(d => d.id === b.defId);
            if (!def) return;
            
            const px = b.x * TILE_SIZE;
            const py = b.y * TILE_SIZE;
            const w = def.width * TILE_SIZE;
            const h = def.height * TILE_SIZE;

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
            
            ctx.fillStyle = def.imageColor; 
            ctx.fillStyle = adjustColor(def.imageColor, -40);
            ctx.fillRect(px + 4, py + 4, w - 8, h - 8); 
            ctx.fillStyle = def.imageColor;
            ctx.fillRect(px + 4, py + 4 - depth, w - 8, h - 8);
            
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(px + 4, py + 4 - depth, 4, h - 8); 
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(px + 4, py + 4 - depth, w - 8, 4); 

            drawBuildingDetails(ctx, def, px + 4, py + 4 - depth, w - 8, h - 8, isNight, b.x, b.y);
          });

          // Destruction
          const now = Date.now();
          effects.forEach(eff => {
             const elapsed = now - eff.startTime;
             if (elapsed < 800) {
                 const progress = elapsed / 800;
                 const px = eff.x * TILE_SIZE;
                 const py = eff.y * TILE_SIZE;
                 
                 ctx.save();
                 ctx.globalAlpha = 1 - progress;
                 ctx.translate(px + TILE_SIZE/2, py + TILE_SIZE/2);
                 ctx.fillStyle = '#94a3b8';
                 ctx.beginPath();
                 ctx.arc(0, 0, TILE_SIZE * 0.8 * progress + 10, 0, Math.PI * 2);
                 ctx.fill();
                 ctx.restore();
             }
          });

          // Day/Night Overlay
          const ambient = getAmbientColor(timeOfDay);
          if (ambient.a > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(${ambient.r}, ${ambient.g}, ${ambient.b}, ${ambient.a})`;
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillRect(-camera.x/camera.zoom, -camera.y/camera.zoom, canvas.width/camera.zoom, canvas.height/camera.zoom);
            ctx.restore();
          }

          // Light Sources
          if (isNight) {
              ctx.save();
              ctx.globalCompositeOperation = 'screen';
              buildings.forEach(b => {
                 const def = BUILDINGS.find(d => d.id === b.defId);
                 if (def && def.lightRadius && b.id !== movingInstanceId) {
                     // Check if this building has lights on (using same seed as windows)
                     const seed = b.x * 100 + b.y;
                     if (pseudoRandom(seed, 0, 0) > 0.4) {
                         const cx = (b.x + def.width/2) * TILE_SIZE;
                         const cy = (b.y + def.height/2) * TILE_SIZE;
                         const r = def.lightRadius * TILE_SIZE;
                         
                         const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
                         g.addColorStop(0, def.lightColor ? def.lightColor.replace('1.0', '0.25') : 'rgba(255,255,200,0.25)'); 
                         g.addColorStop(1, 'rgba(0,0,0,0)');
                         
                         ctx.fillStyle = g;
                         ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
                     }
                 }
              });
              ctx.restore();
          }

          // Ghost Building (Placement Mode)
          if (mode === 'PLACING' && selectedBuildingDef && ghostPosition) {
             const def = selectedBuildingDef;
             const { x: gx, y: gy, valid } = ghostPosition;
             
             const px = gx * TILE_SIZE;
             const py = gy * TILE_SIZE;
             const w = def.width * TILE_SIZE;
             const h = def.height * TILE_SIZE;

             ctx.save();
             ctx.globalAlpha = 0.8;
             
             // Draw base
             ctx.fillStyle = valid ? def.imageColor : COLORS.HIGHLIGHT_INVALID;
             const depth = 20;
             ctx.fillRect(px + 4, py + 4 - depth, w - 8, h - 8);
             
             // Draw outline/grid
             ctx.strokeStyle = valid ? '#ffffff' : '#ff0000';
             ctx.lineWidth = 2;
             ctx.strokeRect(px, py, w, h);
             
             ctx.globalAlpha = 0.3;
             ctx.fillStyle = valid ? COLORS.HIGHLIGHT_VALID : COLORS.HIGHLIGHT_INVALID;
             ctx.fillRect(px, py, w, h);
             
             ctx.restore();
          }

      } catch (err) {
          console.error("Render error:", err);
      } finally {
          ctx.restore(); 
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [mapData, buildings, effects, camera, mode, selectedBuildingDef, ghostPosition, movingInstanceId, timeOfDay]);

  function adjustColor(color: string, amount: number) { return color; }

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
        // Pinch Zoom
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
            // Updated: Ghost placement instead of immediate commit
            actions.setGhostPosition(tx, ty);
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
