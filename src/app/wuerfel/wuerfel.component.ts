import { Component } from '@angular/core';
import { CategoryHeaderComponent } from '../shared/category-header/category-header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wuerfel',
  standalone: true,
  imports: [CategoryHeaderComponent, CommonModule],
  templateUrl: './wuerfel.component.html',
  styleUrl: './wuerfel.component.css'
})
export class WuerfelComponent {
  result: number | null = null;
  animatingDice: string | null = null;

  rollDice(type: string) {
    this.animatingDice = type;
    this.result = null;

    // Simulate animation delay
    setTimeout(() => {
      const max = this.getMaxValue(type);
      this.result = Math.floor(Math.random() * max) + 1;
      this.animatingDice = null;
      this.speakResult(this.result, type);
    }, 1000); // 1 second animation
  }

  private speakResult(result: number, type: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Ergebnis: ${result}`);
      utterance.lang = 'de-DE'; // German language
      utterance.rate = 0.8; // Slightly slower
      utterance.pitch = 1; // Normal pitch
      speechSynthesis.speak(utterance);
    }
  }

  private getMaxValue(type: string): number {
    switch (type) {
      case 'd2': return 2;
      case 'd4': return 4;
      case 'd6': return 6;
      case 'd20': return 20;
      case 'd100': return 100;
      default: return 6;
    }
  }
}
