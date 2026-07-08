
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HttpClientModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  files: string[] = [];
  loadedContent: Record<string, string> = {};

  ngOnInit(): void {
    this.http.get<string[]>('/assets/resources/manifest.json').subscribe(
      (list) => {
        this.files = (list || []).filter((f) => f.toLowerCase().endsWith('.txt'));
      },
      (err) => console.error('Failed to load manifest', err)
    );
  }

  anklickbarFiles(): string[] {
    return this.files.filter((f) => f.toLowerCase().startsWith('anklickbar'));
  }

  smart10Files(): string[] {
    return this.files.filter((f) => {
      const normalized = f.toLowerCase();
      return normalized.startsWith('smart10') || normalized.includes('/smart10/');
    });
  }

  memoryFiles(): string[] {
    return this.files.filter((f) => f.toLowerCase().startsWith('memory'));
  }

  private getFileNameFromPath(path: string): string {
    return path.split('/').pop() || path;
  }

  getDisplayName(filename: string): string {
    const cleanName = this.getFileNameFromPath(filename);
    let name = cleanName.replace('.txt', '');
    if (name.toLowerCase().startsWith('anklickbar')) {
      name = name.substring('anklickbar'.length);
    } else if (name.toLowerCase().startsWith('smart10')) {
      name = name.substring('smart10'.length);
    } else if (name.toLowerCase().startsWith('memory')) {
      name = name.substring('memory'.length);
    }
    return name.trim();
  }

  openCategory(filename: string) {
    // navigate to category page with filename as path param
    const name = encodeURIComponent(filename);
    this.router.navigate(['/anklickbar', name]);
  }

  openSmart10(filename: string) {
    // navigate to smart10 page with filename as path param
    const name = encodeURIComponent(this.getFileNameFromPath(filename));
    this.router.navigate(['/smart10', name]);
  }

  openMemory(filename: string) {
    // navigate to memory page with filename as path param
    const name = encodeURIComponent(filename);
    this.router.navigate(['/memory', name]);
  }

  openWuerfel() {
    // navigate to wuerfel page
    this.router.navigate(['/wuerfel']);
  }

  openBrettspiel() {
    // navigate to brettspiel page
    this.router.navigate(['/brettspiel']);
  }

    openPerfectMatch() {
      // navigate to perfect match page
      this.router.navigate(['/perfect-match']);
    }

    openMinesweeper() {
      // navigate to minesweeper page
      this.router.navigate(['/minesweeper']);
    }

  openRubbellose() {
    this.router.navigate(['/rubbellose']);
  }
}
