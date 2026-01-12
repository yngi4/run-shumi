
export enum GameState {
  START = 'START',
  RUNNING = 'RUNNING',
  GAMEOVER = 'GAMEOVER'
}

export enum Biome {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  INDUSTRIAL = 'INDUSTRIAL',
  DIGITAL = 'DIGITAL'
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'LOW' | 'HIGH' | 'GAP';
}

export interface EnergyCell {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size?: number;
}

export interface ScoreRecord {
  score: number;
  energy: number;
  date: string;
}
