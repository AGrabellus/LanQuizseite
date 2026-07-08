
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CategoryHeaderComponent } from '../shared/category-header/category-header.component';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-anklickbar',
  standalone: true,
  imports: [CommonModule, HttpClientModule, CategoryHeaderComponent],
  templateUrl: './anklickbar.component.html',
  styleUrls: ['./anklickbar.component.css']
})
export class AnklickbarComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private location = inject(Location);

  filename: string | null = null;
  quizFolder: string = '';
  content: string | null = null;
  qaMap: Map<string, string> = new Map();  // Original map for validation
  questionsList: string[] = [];  // Remaining questions to answer
  answersMap: Map<string, boolean> = new Map();  // Antwort → korrekt?
  currentQuestionIndex: number = 0;
  quizState: 'ready' | 'started' | 'finished' = 'ready';
  correctCount: number = 0;
  elapsedSeconds: number = 0;
  timerSubscription: Subscription | null = null;
  showWrongEffect: boolean = false;

  ngOnInit(): void {
    
    this.route.paramMap.subscribe((pm) => {
      const raw = pm.get('file');
      console.log('📍 Route param "file":', raw);
      if (!raw) {
        console.warn('⚠️ No file parameter in route');
        return;
      }
      this.filename = decodeURIComponent(raw);
      this.quizFolder = this.getQuizFolderFromFilename(this.filename);
      console.log('📂 Decoded filename:', this.filename);
      console.log('📁 Quiz folder:', this.quizFolder);
      this.loadFile(this.filename);
    });
  }

  private loadFile(name: string) {
    const url = this.getResourceUrl(name);

    this.http.get(url, { responseType: 'text' }).subscribe(
      (txt) => {

        this.content = txt;
        this.qaMap = this.parseToMap(txt);
        this.questionsList = Array.from(this.qaMap.keys());
        this.answersMap.clear();
        this.currentQuestionIndex = 0;

      },
      (err) => {
        console.error('❌ Failed to load file', err);
        this.content = 'Fehler beim Laden der Datei.';
        this.qaMap = new Map();
        this.questionsList = [];
        this.answersMap = new Map();
      }
    );
  }

  private getResourceUrl(name: string): string {
    const normalized = name.trim().replace(/^\/+/, '').replace(/\\/g, '/');

    if (!normalized) {
      return '/assets/resources/';
    }

    if (normalized.startsWith('assets/resources/')) {
      return `/${normalized}`;
    }

    if (normalized.startsWith('Anklickbar/')) {
      return `/assets/resources/${normalized}`;
    }

    if (normalized.includes('/')) {
      return `/assets/resources/${normalized}`;
    }

    return `/assets/resources/Anklickbar/${normalized}`;
  }

  private getQuizFolderFromFilename(filename: string): string {
    const normalized = filename.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.txt$/i, '');
    const parts = normalized.split('/').filter(Boolean);

    return parts[parts.length - 1] || '';
  }

  private isImageValue(value: string | null | undefined): boolean {
    if (!value) {
      return false;
    }

    const normalized = value.trim().toLowerCase();
    return /\.(png|jpe?g|webp|gif|bmp|svg|ico|tiff?|avif)$/i.test(normalized)
      || normalized.startsWith('data:image/')
      || /^https?:\/\//i.test(normalized);
  }

  getDisplayType(value: string | null | undefined): 'image' | 'text' {
    return this.isImageValue(value) ? 'image' : 'text';
  }

  getValueResourceUrl(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (!this.isImageValue(trimmed)) {
      return null;
    }

    if (trimmed.startsWith('data:image/') || /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
      return trimmed;
    }

    if (trimmed.startsWith('assets/resources/')) {
      return `/${trimmed}`;
    }

    const relativePath = trimmed.replace(/^\.\//, '').replace(/^\/+/, '');
    const quizName = this.filename?.replace(/\\/g, '/').split('/').pop()?.replace(/\.txt$/i, '') || '';
    const normalizedQuizName = quizName.replace(/^Anklickbar/i, '').replace(/^\/+/, '');
    const folderCandidates = [
      normalizedQuizName,
      this.quizFolder.replace(/^Anklickbar/i, ''),
      this.quizFolder,
      quizName,
      this.quizFolder.replace(/^\/+/, ''),
      normalizedQuizName.toLowerCase(),
      normalizedQuizName.charAt(0).toUpperCase() + normalizedQuizName.slice(1)
    ].filter(Boolean);

    const uniqueCandidates = Array.from(new Set(folderCandidates));
    const candidates = uniqueCandidates.flatMap(folder => {
      const cleanFolder = folder.replace(/^\/+/, '').replace(/\/+$/g, '');
      return [
        `/assets/resources/Anklickbar/${cleanFolder}/${relativePath}`,
        `/assets/resources/Anklickbar/${relativePath}`,
        `/assets/resources/${cleanFolder}/${relativePath}`,
        `/assets/resources/${relativePath}`
      ];
    });

    return candidates.find(candidate => candidate) || null;
  }

  private parseToMap(text: string): Map<string, string> {
    const entries: Array<[string, string]> = [];
    if (!text) {
      console.warn('⚠️ parseToMap: text is empty or null');
      return new Map();
    }
    const lines = text.split(/\r?\n/);
    console.log('📍 Total lines:', lines.length);
    
    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const idx = line.indexOf('|');
      if (idx === -1) {
        console.warn('⚠️ No pipe found in line:', line);
        continue;
      }
      const q = line.slice(0, idx).trim();
      const a = line.slice(idx + 1).trim();
      if (q) {
        entries.push([q, a]);
        console.log('✏️ Parsed Q/A:', q, '→', a);
      }
    }
    
    // Randomize entries
    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }
    console.log('✅ After randomize:', entries);
    
    return new Map(entries);
  }


  getCurrentQuestion(): string | null {
    if (this.questionsList.length === 0) return null;
    return this.questionsList[this.currentQuestionIndex] || null;
  }

  getCurrentAnswer(): string | null {
    const q = this.getCurrentQuestion();
    if (!q) return null;
    return this.qaMap.get(q) || null;
  }

  getUnansweredAnswers(): Array<[string, boolean]> {
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) return [];
    
    // Get all unique answers sorted
    const answers = Array.from(this.qaMap.values())
      .filter((a, index, arr) => arr.indexOf(a) === index)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    
    return answers.map(answer => {
      const isCorrect = this.answersMap.get(answer) ?? false;
      return [answer, isCorrect];
    });
  }

  get totalQuestions(): number {
    return this.qaMap.size;
  }

  get remainingQuestions(): number {
    return this.questionsList.length;
  }

  nextQuestion() {
    const total = this.questionsList.length;
    if (total > 0) {
      this.currentQuestionIndex = (this.currentQuestionIndex + 1) % total;
    }
  }

  prevQuestion() {
    const total = this.questionsList.length;
    if (total > 0) {
      this.currentQuestionIndex = (this.currentQuestionIndex - 1 + total) % total;
    }
  }

  selectAnswer(answer: string) {
    const currentQ = this.getCurrentQuestion();
    const correctAnswer = this.getCurrentAnswer();
    const isCorrect = answer === correctAnswer;
    
    if (isCorrect) {
      this.correctCount++;
      console.log('✅ Correct! Count:', this.correctCount);
      this.answersMap.set(answer, true);
      
      // Remove question from list
      if (currentQ && this.currentQuestionIndex < this.questionsList.length) {
        console.log(`🗑️ Entferne Frage: "${currentQ}"`);
        this.questionsList.splice(this.currentQuestionIndex, 1);
        
        // After splice, index automatically points to next question
        // Only adjust if index is now out of bounds
        if (this.currentQuestionIndex >= this.questionsList.length && this.questionsList.length > 0) {
          this.currentQuestionIndex = this.questionsList.length - 1;
        }
      }
      
      // Check if all questions answered
      if (this.questionsList.length === 0) {
        this.finishQuiz();
      }
    } else {
      // Wrong answer
      console.log('❌ Wrong:', answer);
      this.answersMap.set(answer, false);
      
      // Remove question from list
      if (currentQ && this.currentQuestionIndex < this.questionsList.length) {
        console.log(`🗑️ Entferne Frage nach falsch: "${currentQ}"`);
        this.questionsList.splice(this.currentQuestionIndex, 1);
        
        // After splice, index automatically points to next question
        // Only adjust if index is now out of bounds
        if (this.currentQuestionIndex >= this.questionsList.length && this.questionsList.length > 0) {
          this.currentQuestionIndex = this.questionsList.length - 1;
        }
      }
      
      // Check if all questions answered
      if (this.questionsList.length === 0) {
        this.finishQuiz();
        return;
      }
      
      this.showWrongEffect = true;
      setTimeout(() => {
        this.showWrongEffect = false;
      }, 500);
    }
  }

  finishQuiz() {
    this.quizState = 'finished';
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      console.log('⏹️ Timer stopped. Quiz finished!');
    }
  }

  startQuiz() {
    this.quizState = 'started';
    this.elapsedSeconds = 0;
    this.correctCount = 0;
    this.currentQuestionIndex = 0;
    
    // Start timer
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    this.timerSubscription = interval(1000).subscribe(() => {
      this.elapsedSeconds++;
    });
  }

  goBack() {
    this.location.back();
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
}