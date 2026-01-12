
import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Obstacle, Particle, Biome, EnergyCell } from '../types';
import { GRAVITY, JUMP_FORCE, DOUBLE_JUMP_FORCE, INITIAL_SPEED, MAX_SPEED, SPEED_INCREMENT, GROUND_HEIGHT, BIOMES } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (score: number, energy: number) => void;
  onScoreUpdate: (score: number) => void;
  onEnergyCollect: () => void;
}

const HOVER_OFFSET = 24;

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onGameOver, onScoreUpdate, onEnergyCollect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  
  const gameRef = useRef({
    player: {
      x: 60,
      y: 0,
      width: 45,
      height: 65,
      vy: 0,
      isJumping: false,
      isDoubleJumping: false,
      isCrouching: false,
      emotion: 'neutral' as 'neutral' | 'scared' | 'dead',
      targetScaleX: 1,
      targetScaleY: 1,
      scaleX: 1,
      scaleY: 1
    },
    obstacles: [] as Obstacle[],
    energyCells: [] as EnergyCell[],
    particles: [] as Particle[],
    speed: INITIAL_SPEED,
    score: 0,
    energyCount: 0,
    distance: 0,
    nextObstacleTime: 0,
    nextEnergyTime: 0,
    biome: Biome.LIGHT,
    biomeTimer: 0,
    glitchFrames: 0
  });

  const handleInput = useCallback((type: 'jump' | 'crouch' | 'release') => {
    if (gameState !== GameState.RUNNING) return;
    const { player } = gameRef.current;

    if (type === 'jump') {
      if (!player.isJumping) {
        player.vy = JUMP_FORCE;
        player.isJumping = true;
        player.scaleX = 0.92;
        player.scaleY = 1.12;
      } else if (!player.isDoubleJumping) {
        player.vy = DOUBLE_JUMP_FORCE;
        player.isDoubleJumping = true;
        player.scaleX = 0.88;
        player.scaleY = 1.18;
      }
    } else if (type === 'crouch') {
      player.isCrouching = true;
      player.targetScaleX = 1.25;
      player.targetScaleY = 0.75;
    } else if (type === 'release') {
      player.isCrouching = false;
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') handleInput('jump');
      if (e.code === 'ArrowDown') handleInput('crouch');
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') handleInput('release');
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleInput]);

  const resetGame = () => {
    gameRef.current = {
      ...gameRef.current,
      player: {
        x: 60,
        y: 400,
        width: 45,
        height: 65,
        vy: 0,
        isJumping: false,
        isDoubleJumping: false,
        isCrouching: false,
        emotion: 'neutral',
        targetScaleX: 1,
        targetScaleY: 1,
        scaleX: 1,
        scaleY: 1
      },
      obstacles: [],
      energyCells: [],
      particles: [],
      speed: INITIAL_SPEED,
      score: 0,
      energyCount: 0,
      distance: 0,
      nextObstacleTime: 1000,
      nextEnergyTime: 200,
      biome: Biome.LIGHT,
      biomeTimer: 0,
      glitchFrames: 0
    };
  };

  const update = () => {
    const { player, speed, biome, glitchFrames } = gameRef.current;
    if (glitchFrames > 0) gameRef.current.glitchFrames--;

    if (gameState !== GameState.RUNNING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const groundY = canvas.height - GROUND_HEIGHT;

    player.vy += GRAVITY;
    player.y += player.vy;

    const currentH = player.isCrouching ? player.height * 0.7 : player.height;
    
    if (player.isJumping) {
        const velStretch = player.vy * 0.012;
        player.targetScaleY = 1 - velStretch;
        player.targetScaleX = 1 + velStretch * 0.3;
    } else if (player.isCrouching) {
        player.targetScaleX = 1.25;
        player.targetScaleY = 0.75;
    } else {
        player.targetScaleX = 1;
        player.targetScaleY = 1;
    }

    const lerpFactor = 0.12;
    player.scaleX += (player.targetScaleX - player.scaleX) * lerpFactor;
    player.scaleY += (player.targetScaleY - player.scaleY) * lerpFactor;

    if (player.y + currentH + HOVER_OFFSET > groundY) {
      if (player.vy > 4) {
         player.scaleX = 1.15;
         player.scaleY = 0.85;
      }
      player.y = groundY - currentH - HOVER_OFFSET;
      player.vy = 0;
      player.isJumping = false;
      player.isDoubleJumping = false;
    }

    let isObstacleNear = false;
    for (const obs of gameRef.current.obstacles) {
      const d = obs.x - (player.x + player.width);
      if (d > 0 && d < 180) { isObstacleNear = true; break; }
    }
    if (player.emotion !== 'dead') player.emotion = isObstacleNear ? 'scared' : 'neutral';

    gameRef.current.biomeTimer++;
    if (gameRef.current.biomeTimer > 1500) {
      gameRef.current.biomeTimer = 0;
      const biomes = Object.values(Biome);
      gameRef.current.biome = biomes[(biomes.indexOf(biome) + 1) % biomes.length];
    }

    gameRef.current.speed = Math.min(MAX_SPEED, speed + SPEED_INCREMENT);
    gameRef.current.distance += speed;
    const currentScore = gameRef.current.distance / 100;
    gameRef.current.score = currentScore;
    onScoreUpdate(currentScore);

    const difficulty = Math.min(1, currentScore / 400); 
    
    gameRef.current.nextObstacleTime -= speed;
    if (gameRef.current.nextObstacleTime <= 0) {
      const roll = Math.random();
      let type: 'LOW' | 'HIGH' | 'GAP' = 'LOW';
      
      const gapChance = (difficulty < 0.3) ? 0 : 0.05 + (difficulty * 0.15);
      const highChance = (difficulty < 0.2) ? 0.05 : 0.15 + (difficulty * 0.25);
      
      if (roll < gapChance) type = 'GAP';
      else if (roll < gapChance + highChance) type = 'HIGH';
      else type = 'LOW';

      gameRef.current.obstacles.push({
        id: Date.now(),
        x: canvas.width,
        y: type === 'GAP' ? groundY : groundY - (type === 'HIGH' ? 85 : 45),
        width: type === 'GAP' ? 140 : 40 + Math.random() * 30,
        height: type === 'GAP' ? GROUND_HEIGHT : (type === 'HIGH' ? 85 : 45),
        type: type
      });

      const minGap = 800 - (difficulty * 520);
      const variation = 500 - (difficulty * 280);
      gameRef.current.nextObstacleTime = minGap + Math.random() * variation;
    }

    gameRef.current.nextEnergyTime -= speed;
    if (gameRef.current.nextEnergyTime <= 0) {
        gameRef.current.energyCells.push({
            id: Date.now(),
            x: canvas.width,
            y: groundY - 70 - Math.random() * 110,
            collected: false
        });
        gameRef.current.nextEnergyTime = 120 + Math.random() * 150;
    }

    gameRef.current.energyCells = gameRef.current.energyCells.filter(cell => {
        cell.x -= speed;
        if (!cell.collected && Math.abs(cell.x - (player.x + 25)) < 35 && Math.abs(cell.y - (player.y + 35)) < 55) {
            cell.collected = true;
            gameRef.current.energyCount++;
            onEnergyCollect();
            for(let i=0; i<6; i++) {
                gameRef.current.particles.push({
                    x: cell.x, y: cell.y,
                    vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
                    life: 0.8, color: '#fbbf24', size: 3
                });
            }
            return false;
        }
        return cell.x > -50;
    });

    gameRef.current.obstacles = gameRef.current.obstacles.filter(obs => {
      obs.x -= speed;
      const hitBox = { x: player.x + 10, y: player.y + 10, w: player.width - 20, h: currentH - 20 };
      if (hitBox.x < obs.x + obs.width && hitBox.x + hitBox.w > obs.x && hitBox.y < obs.y + obs.height && hitBox.y + hitBox.h > obs.y) {
          player.emotion = 'dead';
          gameRef.current.glitchFrames = 45;
          onGameOver(Math.floor(gameRef.current.score), gameRef.current.energyCount);
          for(let i=0; i<25; i++) {
              gameRef.current.particles.push({
                  x: player.x + 25, y: player.y + 35,
                  vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12,
                  life: 1.0, color: '#ef4444', size: 4
              });
          }
      }
      return obs.x + obs.width > 0;
    });

    gameRef.current.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
    });
    gameRef.current.particles = gameRef.current.particles.filter(p => p.life > 0);
  };

  const draw8BitBuildings = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, theme: any, distance: number) => {
    const groundY = canvas.height - GROUND_HEIGHT;

    // --- FAR PARALLAX (0.1x) ---
    const farPeriod = 4000;
    const farScroll = (distance * 0.1) % farPeriod;
    ctx.globalAlpha = 0.25;
    const farCopies = Math.ceil(canvas.width / farPeriod) + 2;
    for (let i = -1; i < farCopies - 1; i++) {
        const x = i * farPeriod - farScroll;
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(x + 100, groundY - 140, 160, 140);
        ctx.fillRect(x + 260, groundY - 240, 60, 240);
        ctx.beginPath(); ctx.moveTo(x + 260, groundY - 240); ctx.lineTo(x + 290, groundY - 300); ctx.lineTo(x + 320, groundY - 240); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for(let j=0; j<4; j++) ctx.fillRect(x + 115 + j*35, groundY - 110, 20, 40);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 290, groundY - 180, 12, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath(); ctx.moveTo(x + 600, groundY); ctx.lineTo(x + 650, groundY - 150); ctx.lineTo(x + 1000, groundY - 150); ctx.lineTo(x + 1050, groundY); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
        for(let k=0; k<10; k++) { ctx.beginPath(); ctx.moveTo(x + 650 + k*35, groundY - 150); ctx.lineTo(x + 620 + k*35, groundY); ctx.stroke(); }
        ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.moveTo(x + 850, groundY - 150); ctx.lineTo(x + 950, groundY - 220); ctx.lineTo(x + 920, groundY - 150); ctx.fill();
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(x + 830, groundY - 150); ctx.lineTo(x + 880, groundY - 200); ctx.lineTo(x + 900, groundY - 150); ctx.fill();

        ctx.fillStyle = '#cbd5e1'; 
        ctx.fillRect(x + 1200, groundY - 180, 60, 180); 
        ctx.fillRect(x + 1300, groundY - 180, 60, 180); 
        ctx.fillRect(x + 1260, groundY - 140, 40, 60);  
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; 
        for(let m=0; m<5; m++) {
            ctx.fillRect(x + 1210, groundY - 170 + m*30, 40, 10);
            ctx.fillRect(x + 1310, groundY - 170 + m*30, 40, 10);
        }

        ctx.fillStyle = '#ef4444'; 
        ctx.fillRect(x + 1600, groundY - 220, 40, 220); 
        ctx.fillStyle = '#ffffff'; 
        ctx.fillRect(x + 1600, groundY - 180, 40, 30);
        ctx.fillRect(x + 1600, groundY - 100, 40, 30);
        ctx.fillStyle = '#1e293b'; 
        ctx.fillRect(x + 1590, groundY - 230, 60, 10); 
        ctx.beginPath(); ctx.moveTo(x + 1600, groundY - 230); ctx.lineTo(x + 1620, groundY - 260); ctx.lineTo(x + 1640, groundY - 230); ctx.fill();

        ctx.fillStyle = '#991b1b'; 
        ctx.fillRect(x + 2000, groundY - 90, 150, 90); 
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; 
        for(let c=0; c<10; c++) ctx.fillRect(x + 2000 + c*15, groundY - 100, 8, 10);
        ctx.fillStyle = '#451a03'; 
        ctx.beginPath(); ctx.roundRect(x + 2065, groundY - 40, 20, 40, 10); ctx.fill();

        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(x + 2400, groundY - 110, 120, 110);
        ctx.fillStyle = theme.bg; 
        ctx.beginPath(); ctx.roundRect(x + 2415, groundY - 70, 35, 70, 15); ctx.fill();
        ctx.beginPath(); ctx.roundRect(x + 2470, groundY - 70, 35, 70, 15); ctx.fill();
        ctx.fillStyle = '#991b1b'; 
        ctx.fillRect(x + 2400, groundY - 120, 120, 10);

        ctx.fillStyle = '#166534'; 
        for(let p=0; p<5; p++) {
            const px = x + 2800 + p*50;
            ctx.beginPath();
            ctx.moveTo(px, groundY);
            ctx.bezierCurveTo(px - 20, groundY - 40, px + 20, groundY - 60, px, groundY - 100);
            ctx.lineWidth = 6; ctx.strokeStyle = '#166534'; ctx.stroke();
            ctx.fillRect(px - 10, groundY - 110, 20, 20); 
        }
    }

    // --- MID PARALLAX (0.3x) ---
    const midPeriod = 2000;
    const midScroll = (distance * 0.3) % midPeriod;
    const midCopies = Math.ceil(canvas.width / midPeriod) + 2;
    ctx.globalAlpha = 1.0; 
    
    const woodColor = '#ad7136'; 
    const darkOutline = '#27272a'; 

    for (let i = -1; i < midCopies - 1; i++) {
        const x = i * midPeriod - midScroll;
        
        // --- ИНФО-ЦЕНТР (ПРИГЛУШЕННЫЕ ЦВЕТА) ---
        ctx.fillStyle = '#18181b'; // Менее контрастный черный
        ctx.fillRect(x + 50, groundY - 100, 200, 100);
        ctx.fillStyle = '#3f3f46'; // Более мягкая окантовка
        ctx.fillRect(x + 60, groundY - 90, 180, 20);
        ctx.fillStyle = '#991b1b'; // Приглушенный темно-красный
        ctx.fillRect(x + 60, groundY - 70, 30, 40);

        // --- ВЫВЕСКА "ИНФОРМАЦИЯ" (ПРИГЛУШЕННАЯ) ---
        // Стойки
        ctx.fillStyle = '#27272a';
        ctx.fillRect(x + 80, groundY - 130, 6, 30);
        ctx.fillRect(x + 214, groundY - 130, 6, 30);
        // Фон вывески
        ctx.fillStyle = '#1e1e24';
        ctx.fillRect(x + 70, groundY - 155, 160, 30);
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; // Приглушенный сине-серый
        ctx.strokeRect(x + 72, groundY - 153, 156, 26);
        // Текст
        ctx.fillStyle = '#94a3b8'; // Светлый серо-голубой
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ИНФОРМАЦИЯ', x + 150, groundY - 135);
        // Декоративные пиксели
        ctx.fillStyle = '#475569';
        ctx.fillRect(x + 70, groundY - 155, 4, 4);
        ctx.fillRect(x + 226, groundY - 155, 4, 4);
        ctx.fillRect(x + 70, groundY - 129, 4, 4);
        ctx.fillRect(x + 226, groundY - 129, 4, 4);

        ctx.fillStyle = '#44403c';
        ctx.fillRect(x + 510, groundY - 40, 8, 40);
        ctx.fillRect(x + 600, groundY - 40, 8, 40);
        
        ctx.fillStyle = woodColor;
        ctx.beginPath(); 
        ctx.moveTo(x + 500, groundY - 40); 
        ctx.lineTo(x + 500, groundY - 140); 
        ctx.lineTo(x + 620, groundY - 120); 
        ctx.lineTo(x + 620, groundY - 40); 
        ctx.fill();
        ctx.strokeStyle = darkOutline; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#a8a29e'; ctx.fillRect(x + 530, groundY - 100, 40, 30);
        
        ctx.fillStyle = '#78716c';
        ctx.fillRect(x + 680, groundY - 80, 100, 80);

        ctx.fillStyle = '#52525b';
        ctx.fillRect(x + 900, groundY - 120, 120, 120);
        ctx.fillStyle = '#71717a';
        for(let r=0; r<3; r++) {
            for(let c=0; c<3; c++) {
                ctx.fillRect(x + 915 + c*35, groundY - 110 + r*40, 20, 25);
            }
        }

        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(x + 1300, groundY - 160, 80, 160);
        
        ctx.fillStyle = '#44403c';
        ctx.fillRect(x + 1610, groundY - 30, 6, 30);
        ctx.fillRect(x + 1680, groundY - 30, 6, 30);
        
        ctx.fillStyle = woodColor; 
        ctx.beginPath();
        ctx.moveTo(x + 1600, groundY - 30);
        ctx.lineTo(x + 1600, groundY - 110);
        ctx.lineTo(x + 1650, groundY - 150);
        ctx.lineTo(x + 1700, groundY - 110);
        ctx.lineTo(x + 1700, groundY - 30);
        ctx.fill();
        ctx.strokeStyle = darkOutline; ctx.lineWidth = 2; ctx.stroke();
    }

    // --- NEAR PARALLAX (0.5x) ---
    const nearPeriod = 1200;
    const nearScroll = (distance * 0.5) % nearPeriod;
    const nearCopies = Math.ceil(canvas.width / nearPeriod) + 2;
    ctx.globalAlpha = 0.6;
    for (let i = -1; i < nearCopies - 1; i++) {
        const x = i * nearPeriod - nearScroll;
        
        // 8-bit Utility Poles
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 200, groundY - 200, 12, 200);
        ctx.fillRect(x + 180, groundY - 180, 52, 10);
        ctx.fillRect(x + 185, groundY - 160, 42, 6);
        
        // Insulators
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x + 180, groundY - 188, 6, 8);
        ctx.fillRect(x + 226, groundY - 188, 6, 8);
        
        // Wires
        ctx.strokeStyle = '#0f172a';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x + 183, groundY - 188);
        ctx.quadraticCurveTo(x + 183 + nearPeriod/2, groundY - 140, x + 183 + nearPeriod, groundY - 188);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 229, groundY - 188);
        ctx.quadraticCurveTo(x + 229 + nearPeriod/2, groundY - 140, x + 229 + nearPeriod, groundY - 188);
        ctx.stroke();
        ctx.setLineDash([]);

        // Small 8-bit bushes
        ctx.fillStyle = '#166534';
        ctx.fillRect(x + 600, groundY - 40, 60, 40);
        ctx.fillRect(x + 610, groundY - 55, 40, 15);
        ctx.fillStyle = '#14532d';
        ctx.fillRect(x + 615, groundY - 30, 10, 10);
        ctx.fillRect(x + 640, groundY - 25, 10, 10);
    }
    ctx.globalAlpha = 1.0;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext('2d')) return;
    const ctx = canvas.getContext('2d')!;
    const { player, obstacles, particles, biome, speed, glitchFrames, energyCells, distance } = gameRef.current;
    const theme = BIOMES[biome];
    const groundY = canvas.height - GROUND_HEIGHT;

    ctx.save();
    if (glitchFrames > 0) ctx.translate((Math.random()-0.5)*12, (Math.random()-0.5)*12);

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    draw8BitBuildings(ctx, canvas, theme, distance);

    ctx.strokeStyle = theme.ground; ctx.globalAlpha = 0.08; ctx.lineWidth = 1;
    const gridOffset = (distance * 0.06) % 120;
    for(let i = -1; i < canvas.width/120 + 1; i++) { ctx.beginPath(); ctx.moveTo(i * 120 - gridOffset, 0); ctx.lineTo(i * 120 - gridOffset, canvas.height); ctx.stroke(); }
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = theme.ground; ctx.fillRect(0, groundY, canvas.width, GROUND_HEIGHT);
    ctx.fillStyle = theme.accent; ctx.globalAlpha = 0.3; ctx.fillRect(0, groundY, canvas.width, 3); ctx.globalAlpha = 1.0;

    energyCells.forEach(cell => {
        const bounce = Math.sin(Date.now() * 0.008) * 6;
        ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(cell.x, cell.y + bounce, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    });

    obstacles.forEach(obs => {
        if (obs.type === 'GAP') { ctx.fillStyle = theme.bg; ctx.fillRect(obs.x, obs.y, obs.width, obs.height); }
        else { ctx.fillStyle = theme.obstacle; ctx.beginPath(); ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6); ctx.fill(); }
    });

    ctx.save();
    const currentH = player.isCrouching ? player.height * 0.7 : player.height;
    const animStep = distance * 0.08; 
    ctx.translate(player.x + player.width/2, player.y + currentH + HOVER_OFFSET);
    ctx.scale(player.scaleX, player.scaleY);
    ctx.translate(-(player.x + player.width/2), -(player.y + currentH + HOVER_OFFSET));

    const getCleanMaterial = (x: number, y: number, w: number, h: number) => {
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.5, '#f1f5f9'); grad.addColorStop(1, '#e2e8f0');
        return grad;
    };

    const drawLeg = (lx: number, ly: number, moveOffset: number) => {
        const anim = Math.sin(animStep + moveOffset) * 10;
        const finalLY = player.isJumping ? ly + 5 : ly + anim;
        if (!player.isJumping && Math.abs(anim) > 8 && Math.random() > 0.7) {
            gameRef.current.particles.push({ x: lx + 6, y: groundY - 2, vx: -speed * 0.3, vy: -Math.random() * 1.2, life: 0.6, color: theme.accent, size: 1.5 + Math.random() * 1.5 });
        }
        ctx.fillStyle = '#1e293b'; ctx.fillRect(lx + 2, ly - 2, 6, 6);
        ctx.fillStyle = getCleanMaterial(lx, finalLY, 12, 18); ctx.beginPath(); ctx.roundRect(lx, finalLY, 12, 18, 5); ctx.fill();
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.roundRect(lx - 2, finalLY + 18, 16, 8, 3); ctx.fill();
    };

    if (!player.isCrouching) { drawLeg(player.x + 8, player.y + currentH - 5, 0); drawLeg(player.x + player.width - 20, player.y + currentH - 5, Math.PI); }
    const torsoW = player.width - 10, torsoH = currentH * 0.45, torsoX = player.x + 5, torsoY = player.y + currentH * 0.45;
    ctx.fillStyle = getCleanMaterial(torsoX, torsoY, torsoW, torsoH); ctx.beginPath(); ctx.roundRect(torsoX, torsoY, torsoW, torsoH, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.stroke();
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 9px "Inter", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ШУМ', torsoX + torsoW/2, torsoY + torsoH/2 + 3);

    const drawArm = (ax: number, ay: number, moveOffset: number) => {
        const anim = Math.sin(animStep + moveOffset) * 6;
        ctx.fillStyle = getCleanMaterial(ax, ay + anim, 10, 22); ctx.beginPath(); ctx.roundRect(ax, ay + anim, 10, 22, 5); ctx.fill();
        ctx.fillStyle = '#1e293b'; ctx.fillRect(ax + 2, ay + anim + 20, 6, 6);
    };
    if (!player.isCrouching) { drawArm(player.x - 5, player.y + currentH * 0.5, 0); drawArm(player.x + player.width - 5, player.y + currentH * 0.5, Math.PI); }

    const headW = player.width + 10, headH = currentH * 0.5, headX = player.x - 5, headY = player.y;
    ctx.fillStyle = getCleanMaterial(headX, headY, headW, headH); ctx.beginPath(); ctx.roundRect(headX, headY, headW, headH, 14); ctx.fill();
    ctx.fillStyle = '#020617'; ctx.beginPath(); ctx.roundRect(headX + 6, headY + 6, headW - 12, headH - 12, 8); ctx.fill();
    ctx.textAlign = 'center';
    if (player.emotion === 'dead') { ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px monospace'; ctx.fillText('ERROR', headX + headW/2, headY + headH/2 + 4); }
    else if (player.emotion === 'scared') { ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 14px Arial'; ctx.fillText('!!', headX + headW/2, headY + headH/2 + 5); }
    else { ctx.fillStyle = '#ffffff'; const eyePulse = Math.sin(Date.now() * 0.01) * 2; ctx.fillRect(headX + 14, headY + 14 + eyePulse, 6, 6); ctx.fillRect(headX + headW - 20, headY + 14 + eyePulse, 6, 6); }
    ctx.restore();

    particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI*2); ctx.fill(); });
    ctx.globalAlpha = 1.0;
    if (glitchFrames > 0) { ctx.fillStyle = Math.random() > 0.5 ? '#0ea5e9' : '#d946ef'; ctx.globalAlpha = 0.1; for(let i=0; i<6; i++) { ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*400, 15); } ctx.globalAlpha = 1.0; }
    ctx.restore();
  };

  const animate = () => { update(); draw(); requestRef.current = requestAnimationFrame(animate); };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize();
    requestRef.current = requestAnimationFrame(animate);
    return () => { window.removeEventListener('resize', resize); if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState]);

  useEffect(() => { if (gameState === GameState.RUNNING) resetGame(); }, [gameState]);

  return (
    <canvas 
      ref={canvasRef} 
      className="block w-full h-full cursor-none"
      onMouseDown={() => handleInput('jump')}
      onTouchStart={() => handleInput('jump')}
    />
  );
};

export default GameCanvas;
