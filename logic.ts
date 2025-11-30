import { CellType, Grid, Position, Direction } from './types';

// Helper to deep copy the grid
export const cloneGrid = (grid: Grid): Grid => grid.map(row => [...row]);

// Check if a level is completed (no loose boxes '$' left, only boxes on targets '*')
export const checkWin = (grid: Grid): boolean => {
  for (const row of grid) {
    for (const cell of row) {
      if (cell === CellType.Box) {
        return false;
      }
    }
  }
  return true;
};

// Parse a level string array into a mutable 2D grid
export const parseLevel = (levelDesign: string[]): { grid: Grid; playerPos: Position } => {
  let playerPos: Position = { x: 0, y: 0 };
  const grid = levelDesign.map((rowStr, y) => {
    const row = rowStr.split('');
    row.forEach((char, x) => {
      if (char === CellType.Player || char === CellType.PlayerOnTarget) {
        playerPos = { x, y };
      }
    });
    return row;
  });
  return { grid, playerPos };
};

// Calculate new position based on direction
const getOffset = (dir: Direction): { dx: number; dy: number } => {
  switch (dir) {
    case 'UP': return { dx: 0, dy: -1 };
    case 'DOWN': return { dx: 0, dy: 1 };
    case 'LEFT': return { dx: -1, dy: 0 };
    case 'RIGHT': return { dx: 1, dy: 0 };
  }
};

// Attempt to move the player
export const movePlayer = (
  currentGrid: Grid,
  playerPos: Position,
  dir: Direction
): { grid: Grid; playerPos: Position; moved: boolean; pushed: boolean } | null => {
  
  const { dx, dy } = getOffset(dir);
  const newX = playerPos.x + dx;
  const newY = playerPos.y + dy;
  
  // Bounds check (though walls usually prevent this)
  if (newY < 0 || newY >= currentGrid.length || newX < 0 || newX >= currentGrid[0].length) {
    return null;
  }

  const targetCell = currentGrid[newY][newX];
  const newGrid = cloneGrid(currentGrid);
  
  // Logic for what happens at the target cell
  let canMove = false;
  let pushed = false;

  // Case 1: Empty Floor or Target -> Move
  if (targetCell === CellType.Floor || targetCell === CellType.Target) {
    canMove = true;
  }
  // Case 2: Box -> Try to push
  else if (targetCell === CellType.Box || targetCell === CellType.BoxOnTarget) {
    const boxNextX = newX + dx;
    const boxNextY = newY + dy;
    
    // Check bounds for box destination
    if (boxNextY < 0 || boxNextY >= newGrid.length || boxNextX < 0 || boxNextX >= newGrid[0].length) {
      return null;
    }

    const boxDestCell = newGrid[boxNextY][boxNextX];
    
    // Can push into Floor or Target
    if (boxDestCell === CellType.Floor || boxDestCell === CellType.Target) {
      // Move Box
      const newBoxChar = boxDestCell === CellType.Target ? CellType.BoxOnTarget : CellType.Box;
      newGrid[boxNextY][boxNextX] = newBoxChar;
      canMove = true;
      pushed = true;
    }
  }
  
  // If we can move, update the grid for the player movement
  if (canMove) {
    // 1. Clear old player position
    const oldCell = newGrid[playerPos.y][playerPos.x];
    newGrid[playerPos.y][playerPos.x] = oldCell === CellType.PlayerOnTarget ? CellType.Target : CellType.Floor;
    
    // 2. Set new player position
    const isTargetUnderneath = 
      targetCell === CellType.Target || 
      targetCell === CellType.BoxOnTarget || 
      targetCell === CellType.PlayerOnTarget; 

    newGrid[newY][newX] = isTargetUnderneath ? CellType.PlayerOnTarget : CellType.Player;

    return {
      grid: newGrid,
      playerPos: { x: newX, y: newY },
      moved: true,
      pushed
    };
  }

  return null; // Hit a wall or unmovable box
};