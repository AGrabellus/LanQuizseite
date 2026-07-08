import { Component, Input, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-category-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-header.component.html',
  styleUrls: ['./category-header.component.css']
})
export class CategoryHeaderComponent {
  @Input() category: string | null = null;
  @Input() filename: string | null = null;

  private location = inject(Location);

  goBack() {
    this.location.back();
  }

  get displayFilename(): string | null {
    if (!this.filename) return null;
    return this.filename.replace(/\.txt$/i, '');
  }
}
