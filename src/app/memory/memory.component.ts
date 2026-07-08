import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CategoryHeaderComponent } from '../shared/category-header/category-header.component';
import { FormsModule } from '@angular/forms';

interface Player {
  id: string;
  name: string;
  score: number;
}

interface MemoryCard {
  id: number;
  type: 'image' | 'text';
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryPair {
  image: string;
  text: string;
}

@Component({
  selector: 'app-memory',
  standalone: true,
  imports: [CommonModule, CategoryHeaderComponent, HttpClientModule, FormsModule],
  templateUrl: './memory.component.html',
  styleUrl: './memory.component.css'
})
export class MemoryComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  players: Player[] = [];
  newPlayerName: string = '';
  showPlayerInput: boolean = false;
  gameState: 'ready' | 'started' | 'finished' = 'ready';
  currentPlayerIndex: number = 0;

  pairs: MemoryPair[] = [];
  cards: MemoryCard[] = [];
  flippedCards: MemoryCard[] = [];
  filename: string = '';
  folder: string = '';
  gameWon: boolean = false;

  ngOnInit(): void {    
    this.route.paramMap.subscribe((pm) => {
      const raw = pm.get('file');
      console.log('📍 Route param "file":', raw);
      if (!raw) {
        console.warn('⚠️ No file parameter in route');
        return;
      }
      this.filename = decodeURIComponent(raw);
      console.log('📂 Decoded filename:', this.filename);
      this.folder = this.getFolderFromFilename(this.filename);
      console.log('📁 Folder:', this.folder);
      this.loadMemoryData();
    });
  }

  loadMemoryData(): void {
    const filePath = `/assets/resources/${this.filename}`;
    this.http.get(filePath, { responseType: 'text' }).subscribe({
      next: (content: string) => {
        this.parsePairs(content);
        this.initializeGame();
      },
      error: (err) => {
        console.error('Error loading memory file:', err);
      }
    });
  }

  private getFolderFromFilename(filename: string): string {
    const normalized = filename.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.txt$/i, '');
    const parts = normalized.split('/').filter(Boolean);

    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }

    return parts[0]?.replace(/^memory/i, '') || '';
  }

  parsePairs(content: string): void {
    const lines = content.split('\n').filter(line => line.trim());
    this.pairs = [];
    lines.forEach(line => {
      const parts = line.split('|').map(p => p.trim().replace(/"/g, ''));
      if (parts.length === 2) {
        this.pairs.push({
          image: parts[0],
          text: parts[1]
        });
      }
    });
  }

  initializeGame(): void {
    this.cards = [];
    let id = 0;
    this.pairs.forEach(pair => {
      // Add image card
      this.cards.push({
        id: id++,
        type: 'image',
        content: pair.image,
        isFlipped: false,
        isMatched: false
      });
      // Add text card
      this.cards.push({
        id: id++,
        type: 'text',
        content: pair.text,
        isFlipped: false,
        isMatched: false
      });
    });
    // Shuffle cards
    this.cards = this.shuffleArray(this.cards);
  }

  shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  onCardClick(card: MemoryCard): void {
    if (card.isFlipped || card.isMatched || this.flippedCards.length >= 2) {
      return;
    }
    card.isFlipped = true;
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      setTimeout(() => {
        this.checkMatch();
      }, 1000);
    }
  }

  checkMatch(): void {
    const [card1, card2] = this.flippedCards;
    const pair1 = this.pairs.find(p => p.image === card1.content || p.text === card1.content);
    const pair2 = this.pairs.find(p => p.image === card2.content || p.text === card2.content);

    if (pair1 === pair2) {
      // Match
      card1.isMatched = true;
      card2.isMatched = true;
      // Score erhöhen für aktuellen Spieler
      this.players[this.currentPlayerIndex].score++;
      // Spieler darf nochmal dran sein - kein Wechsel
    } else {
      // No match
      card1.isFlipped = false;
      card2.isFlipped = false;
      // Spielerwechsel bei falschem Paar
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
    this.flippedCards = [];

    // Check if game is won
    this.gameWon = this.cards.every(card => card.isMatched);
    if (this.gameWon) {
      this.gameState = 'finished';
    }
  }

  resetGame(): void {
    this.gameWon = false;
    this.flippedCards = [];
    this.gameState = 'ready';
    this.currentPlayerIndex = 0;
    this.players.forEach(p => p.score = 0);
    this.initializeGame();
  }

  addPlayer() {
    if (this.newPlayerName.trim()) {
      const player: Player = {
        id: Math.random().toString(36).substr(2, 9),
        name: this.newPlayerName.trim(),
        score: 0
      };
      this.players.push(player);
      this.newPlayerName = '';
      this.showPlayerInput = false;
    }
  }

  removePlayer(id: string) {
    this.players = this.players.filter(p => p.id !== id);
  }

  togglePlayerInput() {
    this.showPlayerInput = !this.showPlayerInput;
    this.newPlayerName = '';
  }

  startGame() {
    if (this.players.length > 0) {
      this.gameState = 'started';
      this.currentPlayerIndex = 0;
    }
  }
}
