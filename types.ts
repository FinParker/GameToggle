export enum CellType {
  Floor = ' ',
  Wall = '#',
  Box = '$',
  Target = '.',
  BoxOnTarget = '*',
  Player = '@',
  PlayerOnTarget = '+',
}

export type Grid = string[][];

export interface Position {
  x: number; // Column
  y: number; // Row
}

export interface GameState {
  grid: Grid;
  playerPos: Position;
  moves: number;
  levelCompleted: boolean;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameType = 'sokoban' | 'snake' | 'rhythm';
