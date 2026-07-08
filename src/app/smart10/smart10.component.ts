import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CategoryHeaderComponent } from '../shared/category-header/category-header.component';

interface Player {
  id: string;
  name: string;
  score: number;
  errors: number;
  hasPassedFinal?: boolean;
}

interface Question {
  text: string;
  correct: boolean;
  answered: boolean;
  isCorrect?: boolean;
}

@Component({
  selector: 'app-smart10',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryHeaderComponent, HttpClientModule],
  templateUrl: './smart10.component.html',
  styleUrls: ['./smart10.component.css']
})
export class Smart10Component implements OnInit, OnDestroy {
  private location = inject(Location);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  players: Player[] = [];
  newPlayerName: string = '';
  showPlayerInput: boolean = false;
  gameState: 'ready' | 'started' | 'finished' = 'ready';
  currentPlayerIndex: number = 0;
  elapsedSeconds: number = 0;
  
  qaMap: Map<string, boolean> = new Map();
  questions: Question[] = [];
  filename: string = '';

  ngOnInit(): void {
    console.log('🚀 Smart10Component ngOnInit');
    this.route.params.subscribe(params => {
      if (params['file']) {
        this.filename = params['file'];
        this.loadSmartQuestions();
      }
    });
  }

  loadSmartQuestions(): void {
    const filename = this.getSmart10Filename(this.filename);
    const filePath = `/assets/resources/${filename}`;
    console.log('📁 Loading Smart10 file:', filePath);
    
    this.http.get(filePath, { responseType: 'text' }).subscribe({
      next: (content: string) => {
        this.parseQuestions(content);
        console.log('✅ Questions loaded:', this.questions.length);
        console.log('📋 QA Map:', this.qaMap);
      },
      error: (err) => {
        console.error('❌ Error loading file:', err);
      }
    });
  }

  private getSmart10Filename(filename: string): string {
    const normalized = filename.replace(/\\/g, '/');
    if (normalized.toLowerCase().startsWith('smart10/')) {
      return normalized;
    }
    return `smart10/${normalized}`;
  }

  parseQuestions(content: string): void {
    const lines = content.split('\n').filter(line => line.trim());
    this.questions = [];
    this.qaMap.clear();
    
    lines.forEach(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length === 2) {
        const question = parts[0];
        const isCorrect = parts[1].toLowerCase() === 'true';
        
        this.qaMap.set(question, isCorrect);
        this.questions.push({
          text: question,
          correct: isCorrect,
          answered: false,
          isCorrect: undefined
        });
      }
    });
    
    console.log('📊 Parsed', this.questions.length, 'questions');
  }

  addPlayer() {
    if (this.newPlayerName.trim()) {
      const player: Player = {
        id: Math.random().toString(36).substr(2, 9),
        name: this.newPlayerName.trim(),
        score: 0,
        errors: 0
      };
      this.players.push(player);
      this.newPlayerName = '';
      this.showPlayerInput = false;
      console.log('✅ Player added:', player.name);
    }
  }

  removePlayer(id: string) {
    this.players = this.players.filter(p => p.id !== id);
    console.log('🗑️ Player removed');
  }

  togglePlayerInput() {
    this.showPlayerInput = !this.showPlayerInput;
    this.newPlayerName = '';
  }

  startGame() {
    if (this.players.length > 0) {
      this.gameState = 'started';
      this.currentPlayerIndex = 0;
      this.elapsedSeconds = 0;
      console.log('🎮 Game started with', this.players.length, 'players');
    }
  }

  answerQuestion(question: Question): void {
    if (question.answered) return;
    
    question.answered = true;
    question.isCorrect = question.correct;
    
    if (question.correct) {
      this.players[this.currentPlayerIndex].score++;
      console.log('✅ Correct! Player', this.players[this.currentPlayerIndex].name, 'scored');
    } else {
      this.players[this.currentPlayerIndex].errors++;
      console.log('❌ Wrong answer - Error count:', this.players[this.currentPlayerIndex].errors);
    }

    // Nächsten aktiven Spieler finden (überspringe passierende Spieler)
    this.moveToNextActivePlayer();
  }

  moveToNextActivePlayer(): void {
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
    let attempts = 0;
    
    // Finde den nächsten Spieler, der nicht gepasst hat
    while (this.players[nextIndex].hasPassedFinal && attempts < this.players.length) {
      nextIndex = (nextIndex + 1) % this.players.length;
      attempts++;
    }
    
    this.currentPlayerIndex = nextIndex;
  }

  getPlayerFinalScore(player: Player): number {
    return Math.max(0, player.score - player.errors);
  }

  getSortedPlayers(): Player[] {
    return [...this.players].sort((a, b) => {
      return this.getPlayerFinalScore(b) - this.getPlayerFinalScore(a);
    });
  }

  passForRest(): void {
    const currentPlayer = this.players[this.currentPlayerIndex];
    currentPlayer.hasPassedFinal = true;
    console.log('🛑 Player', currentPlayer.name, 'has passed for the rest of the game');
    
    // Prüfe, ob noch aktive Spieler vorhanden sind
    const activePlayers = this.players.filter(p => !p.hasPassedFinal);
    if (activePlayers.length === 0) {
      // Spiel beenden, wenn keine aktiven Spieler mehr
      this.endGame();
    } else {
      // Nächsten aktiven Spieler finden
      this.moveToNextActivePlayer();
    }
  }

  endGame() {
    this.gameState = 'finished';
    console.log('🏁 Game finished');
  }

  goBack() {
    this.location.back();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }
}
