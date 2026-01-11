import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { TILE_SIZE, COLORS, BUILDINGS, MIN_ZOOM, MAX_ZOOM } from '../constants';
import { TileType, PlacedBuilding, BuildingDef } from '../types';
import { audioService } from '../services/audioService';

interface WorldMapProps {
  onInteract: () => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ onInteract }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { mapData, buildings, mode, selectedBuildingDef, actions } = useGame();
  
  // Camera State
  const [camera, setCamera] = useState({ 
    x: -(mapData.width * TILE_SIZE) / 2 + window.innerWidth / 2, 
    y: -(mapData.height * TILE_SIZE) / 2 + window.innerHeight / 2, 
    zoom: 1 
  });
  
  // Interaction State
  const activePointers = useRef<Map<number, {x: number, y: number}>>(new Map());
  const prevPinchInfo = useRef<{dist: number, center: {x: number, y: number}} | null>(null);
  const isDragging = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 }); // For single finger pan delta
  const longPressTimer = useRef<number | null>(null);

  // Mouse Grid Position
  const [hoverTile, setHoverTile] = useState({ x: -1, y: -1 });

  // --- Rendering Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // 1. Clear & Setup
      ctx.fillStyle = COLORS.WATER;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      
      // 2. Apply Camera
      ctx.translate(camera.x, camera.y);
      ctx.scale(camera.zoom, camera.zoom);

      // 3. Draw Map Tiles
      // Calculate visible bounds for optimization
      const startCol = Math.floor((-camera.x / camera.zoom) / TILE_SIZE);
      const endCol = startCol + (canvas.width / camera.zoom) / TILE_SIZE + 1;
      const startRow = Math.floor((-camera.y / camera.zoom) / TILE_SIZE);
      const endRow = startRow + (canvas.height / camera.zoom) / TILE_SIZE + 1;

      const startX = Math.max(0, startCol);
      const startY = Math.max(0, startRow);
      const endX = Math.min(mapData.width, endCol);
      const endY = Math.min(mapData.height, endRow);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const tile = mapData.tiles[y][x];
          const posX = x * TILE_SIZE;
          const posY = y * TILE_SIZE;

          if (tile === TileType.GRASS) {
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
            // Light Grid
            ctx.strokeStyle = COLORS.GRID;
            ctx.lineWidth = 1;
            ctx.strokeRect(posX, posY, TILE_SIZE, TILE_SIZE);
          } else if (tile === TileType.SAND) {
            ctx.fillStyle = COLORS.SAND;
            ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
          } else if (tile === TileType.ROAD) {
            ctx.fillStyle = COLORS.ROAD;
            ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
            
            // Draw Road Markings (Simple Center Line)
            ctx.fillStyle = COLORS.ROAD_MARKING;
            const dashSize = 10;
            ctx.fillRect(posX + TILE_SIZE/2 - 2, posY + TILE_SIZE/2 - dashSize/2, 4, dashSize);
            ctx.fillRect(posX + TILE_SIZE/2 - dashSize/2, posY + TILE_SIZE/2 - 2, dashSize, 4);
          }
        }
      }

      // 4. Draw Buildings (Classic 3D Style)
      const sortedBuildings = [...buildings].sort((a, b) => a.y - b.y);
      
      sortedBuildings.forEach(b => {
        const def = BUILDINGS.find(d => d.id === b.defId);
        if (!def) return;
        
        const px = b.x * TILE_SIZE;
        const py = b.y * TILE_SIZE;
        const w = def.width * TILE_SIZE;
        const h = def.height * TILE_SIZE;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(px + w/2, py + h - 5, w/2 - 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Building Block 
        const depth = 15; // 3D height
        
        // Main Body
        ctx.fillStyle = def.imageColor;
        ctx.fillRect(px + 2, py + 2 - depth, w - 4, h - 4);
        
        // Roof Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(px + 2, py + 2 - depth, w - 4, (h - 4)/2);

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 2, py + 2 - depth, w - 4, h - 4);
        
        // Name Label (if zoomed)
        if (camera.zoom > 1.2) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(def.name, px + w/2, py - depth - 8);
            ctx.shadowBlur = 0;
        }
      });

      // 5. Ghost Building (Placement)
      if (mode === 'PLACING' && selectedBuildingDef && hoverTile.x >= 0) {
        const def = selectedBuildingDef;
        const px = hoverTile.x * TILE_SIZE;
        const py = hoverTile.y * TILE_SIZE;
        const w = def.width * TILE_SIZE;
        const h = def.height * TILE_SIZE;

        let valid = true;
        // Bounds
        if (hoverTile.x < 0 || hoverTile.y < 0 || hoverTile.x + def.width > mapData.width || hoverTile.y + def.height > mapData.height) {
            valid = false;
        } else {
             // Terrain check (Must be GRASS or SAND)
            for(let i=0; i<def.width; i++) {
                for(let j=0; j<def.height; j++) {
                    const tile = mapData.tiles[hoverTile.y+j]?.[hoverTile.x+i];
                    if (tile !== TileType.GRASS && tile !== TileType.SAND) valid = false;
                }
            }
            // Collision
            buildings.forEach(b => {
                const bDef = BUILDINGS.find(d => d.id === b.defId)!;
                if (
                    hoverTile.x < b.x + bDef.width &&
                    hoverTile.x + def.width > b.x &&
                    hoverTile.y < b.y + bDef.height &&
                    hoverTile.y + def.height > b.y
                ) {
                    valid = false;
                }
            });
        }

        ctx.fillStyle = valid ? COLORS.HIGHLIGHT_VALID : COLORS.HIGHLIGHT_INVALID;
        ctx.fillRect(px, py, w, h);
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, w, h);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [mapData, buildings, camera, mode, selectedBuildingDef, hoverTile]);

  // --- Logic ---
  const screenToWorld = (sx: number, sy: number) => ({
    x: (sx - camera.x) / camera.zoom,
    y: (sy - camera.y) / camera.zoom,
  });

  // Pointer Events (Mouse + Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    canvasRef.current?.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    // Interaction Trigger
    if (activePointers.current.size === 1) {
        onInteract();
        isDragging.current = false;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        
        longPressTimer.current = window.setTimeout(() => {
            // Placeholder for long press
        }, 500);
    } 
    else if (activePointers.current.size === 2) {
        // Start Pinch
        isDragging.current = false; // Disable pan drag if pinching starts
        if (longPressTimer.current) clearTimeout(longPressTimer.current);

        const points = Array.from(activePointers.current.values());
        const p1 = points[0];
        const p2 = points[1];
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        prevPinchInfo.current = { dist, center };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (longPressTimer.current) { 
        // Cancel long press on move
        const dx = Math.abs(e.clientX - lastPanPos.current.x);
        const dy = Math.abs(e.clientY - lastPanPos.current.y);
        if (dx > 5 || dy > 5) {
             clearTimeout(longPressTimer.current); 
             longPressTimer.current = null;
        }
    }

    // --- PINCH ZOOM (2 Fingers) ---
    if (activePointers.current.size === 2) {
        const points = Array.from(activePointers.current.values());
        const p1 = points[0];
        const p2 = points[1];
        
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

        if (prevPinchInfo.current) {
            const oldDist = prevPinchInfo.current.dist;
            const oldCenter = prevPinchInfo.current.center;

            if (oldDist > 10 && dist > 10) {
                const zoomRatio = dist / oldDist;
                
                setCamera(prev => {
                    let newZoom = prev.zoom * zoomRatio;
                    newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
                    
                    // Effective ratio after clamping
                    const effectiveRatio = newZoom / prev.zoom;

                    // Calculate new offset to keep world point under 'center' (and account for center movement)
                    // Formula: NewOffset = Center - (OldCenter - OldOffset) * Ratio
                    const newX = center.x - (oldCenter.x - prev.x) * effectiveRatio;
                    const newY = center.y - (oldCenter.y - prev.y) * effectiveRatio;

                    return { x: newX, y: newY, zoom: newZoom };
                });
            }
        }
        prevPinchInfo.current = { dist, center };
        return;
    }

    // --- PAN (1 Finger / Mouse) ---
    if (activePointers.current.size === 1 && e.isPrimary) {
        const dx = e.clientX - lastPanPos.current.x;
        const dy = e.clientY - lastPanPos.current.y;
        
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) isDragging.current = true;

        if (isDragging.current) {
            setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            lastPanPos.current = { x: e.clientX, y: e.clientY };
        }

        // --- PLACEMENT HOVER ---
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
    
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    // Reset Pinch info if not enough fingers
    if (activePointers.current.size < 2) {
        prevPinchInfo.current = null;
    }

    // Reset Pan reference to remaining finger to prevent jump
    if (activePointers.current.size === 1) {
        const p = activePointers.current.values().next().value;
        if (p) lastPanPos.current = { x: p.x, y: p.y };
    }

    // --- CLICK HANDLING ---
    // Only if we weren't dragging/pinching
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
    
    // Reset dragging if no pointers left
    if (activePointers.current.size === 0) {
        isDragging.current = false;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Prevent default browser zoom
    // e.preventDefault(); // Passive event listeners cannot prevent default usually, handled by CSS
    
    const { clientX, clientY, deltaY } = e;
    
    setCamera(prev => {
        // Zoom factor
        const scaleAmount = -deltaY * 0.001; 
        let newZoom = prev.zoom * (1 + scaleAmount);
        newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
        
        // Calculate ratio
        const zoomRatio = newZoom / prev.zoom;

        // Zoom towards mouse:
        // P_world = (Mouse - Cam) / Zoom
        // NewCam = Mouse - P_world * NewZoom
        // NewCam = Mouse - ((Mouse - Cam) / Zoom) * NewZoom
        // NewCam = Mouse - (Mouse - Cam) * Ratio
        
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