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
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
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
            // Check neighbors to connect lines roughly
            // For simplicity in this view, just a center dash
            const dashSize = 10;
            ctx.fillRect(posX + TILE_SIZE/2 - 2, posY + TILE_SIZE/2 - dashSize/2, 4, dashSize);
            ctx.fillRect(posX + TILE_SIZE/2 - dashSize/2, posY + TILE_SIZE/2 - 2, dashSize, 4);
          }
          // Water is background
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
             // Terrain check (Must be GRASS or SAND - relaxed for fun)
             // Let's allow building on Sand too now, but not Water or Road
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

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = false;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    onInteract();
    longPressTimer.current = window.setTimeout(() => {}, 500);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    
    if (e.buttons === 1) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) isDragging.current = true;

      if (isDragging.current) {
        setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    }

    if (mode === 'PLACING') {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      const tx = Math.floor(worldPos.x / TILE_SIZE);
      const ty = Math.floor(worldPos.y / TILE_SIZE);
      setHoverTile({ x: tx, y: ty });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    if (!isDragging.current) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      const tx = Math.floor(worldPos.x / TILE_SIZE);
      const ty = Math.floor(worldPos.y / TILE_SIZE);

      if (mode === 'PLACING' && selectedBuildingDef) {
        const success = actions.placeBuilding(selectedBuildingDef, tx, ty);
        if (success) { /* feedback */ }
      } else if (mode === 'VIEW' || mode === 'INSPECT') {
        const clickedBuilding = [...buildings].reverse().find(b => {
          const def = BUILDINGS.find(d => d.id === b.defId)!;
          return (tx >= b.x && tx < b.x + def.width && ty >= b.y && ty < b.y + def.height);
        });
        actions.selectInstance(clickedBuilding || null);
      }
    }
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = -e.deltaY * 0.001;
    setCamera(prev => ({ ...prev, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom + delta)) }));
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
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

export default WorldMap;