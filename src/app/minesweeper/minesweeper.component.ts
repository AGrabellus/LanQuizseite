import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Cell {
  revealed: boolean;
  flagged: boolean;
  hasBomb: boolean;
  adjacent: number;
}

@Component({
  selector: 'app-minesweeper',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './minesweeper.component.html',
  styleUrl: './minesweeper.component.css'
})
export class MinesweeperComponent {
  rows = 8;
  cols = 8;
  bombs = 10;
  action: 'open' | 'flag' = 'open';

  grid: Cell[][] = [];
  gameStarted = false;
  gameOver = false;
  win = false;
  remainingFlags = 0;

  startGame() {
    const max = this.rows * this.cols - 1;
    if (this.bombs > max) this.bombs = Math.max(1, Math.floor(max / 4));

    this.initGrid();
    this.placeBombs();
    this.calculateAdjacents();
    this.gameStarted = true;
    this.gameOver = false;
    this.win = false;
    this.remainingFlags = this.bombs;
  }

  initGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({ revealed: false, flagged: false, hasBomb: false, adjacent: 0 });
      }
      this.grid.push(row);
    }
  }

  placeBombs() {
    let placed = 0;
    while (placed < this.bombs) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      if (!this.grid[r][c].hasBomb) {
        this.grid[r][c].hasBomb = true;
        placed++;
      }
    }
  }

  calculateAdjacents() {
    const dirs = [-1, 0, 1];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].hasBomb) continue;
        let cnt = 0;
        for (const dr of dirs) for (const dc of dirs) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < this.rows && cc >= 0 && cc < this.cols) {
            if (this.grid[rr][cc].hasBomb) cnt++;
          }
        }
        this.grid[r][c].adjacent = cnt;
      }
    }
  }

  onCellClick(r: number, c: number) {
    if (this.gameOver || !this.gameStarted) return;

    const cell = this.grid[r][c];
    if (this.action === 'flag') {
      this.toggleFlag(r, c);
      return;
    }

    if (cell.revealed && cell.adjacent > 0) {
      this.openSurrounding(r, c);
      return;
    }

    this.openCell(r, c);
  }

  onRightClick(e: MouseEvent, r: number, c: number) {
    e.preventDefault();
    if (this.gameOver || !this.gameStarted) return;
    this.toggleFlag(r, c);
  }

  toggleFlag(r: number, c: number) {
    const cell = this.grid[r][c];
    if (cell.revealed) return;
    if (!cell.flagged && this.remainingFlags <= 0) return;
    cell.flagged = !cell.flagged;
    this.remainingFlags += cell.flagged ? -1 : 1;
    this.checkWin();
  }

  openCell(r: number, c: number) {
    const cell = this.grid[r][c];
    if (cell.revealed || cell.flagged) return;
    cell.revealed = true;
    if (cell.hasBomb) {
      this.revealAllBombs();
      this.gameOver = true;
      this.win = false;
      return;
    }
    if (cell.adjacent === 0) this.floodFill(r, c);
    this.checkWin();
  }

  floodFill(r: number, c: number) {
    const stack: [number, number][] = [[r, c]];
    while (stack.length) {
      const [rr, cc] = stack.pop()!;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = rr + dr, nc = cc + dc;
        if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
        const neigh = this.grid[nr][nc];
        if (neigh.revealed || neigh.flagged) continue;
        neigh.revealed = true;
        if (neigh.adjacent === 0 && !neigh.hasBomb) stack.push([nr, nc]);
      }
    }
  }

  revealAllBombs() {
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const cell = this.grid[r][c];
      if (cell.hasBomb) cell.revealed = true;
    }
  }

  openSurrounding(r: number, c: number) {
    const dirs = [-1, 0, 1];
    for (const dr of dirs) {
      for (const dc of dirs) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
        const neighbor = this.grid[nr][nc];
        if (neighbor.revealed || neighbor.flagged) continue;
        this.openCell(nr, nc);
      }
    }
  }

  checkWin() {
    let allSafeRevealed = true;
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const cell = this.grid[r][c];
      if (!cell.hasBomb && !cell.revealed) allSafeRevealed = false;
    }
    if (allSafeRevealed) {
      this.gameOver = true;
      this.win = true;
    }
  }

  resetGame() {
    this.gameStarted = false;
    this.gameOver = false;
    this.win = false;
    this.grid = [];
    this.remainingFlags = 0;
  }
}
