import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  template: `
    <div class="skeleton-container" [ngClass]="{'rounded': rounded, 'circle': circle}">
      @if (lines > 1) {
        @for (line of getLines(); track $index) {
          <div class="skeleton-line" [style.width]="getLineWidth($index)"></div>
        }
      } @else {
        <div class="skeleton-line" [style.width]="width" [style.height]="height"></div>
      }
    </div>
  `,
  styles: [`
    .skeleton-container {
      display: flex;
      flex-direction: column;
      gap: 8px;

      &.rounded {
        .skeleton-line {
          border-radius: 8px;
        }
      }

      &.circle {
        .skeleton-line {
          border-radius: 50%;
          width: 48px;
          height: 48px;
        }
      }
    }

    .skeleton-line {
      background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      height: 16px;
      border-radius: 4px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
  imports: [CommonModule]
})
export class SkeletonComponent {
  @Input() lines: number = 1;
  @Input() width: string = '100%';
  @Input() height: string = '16px';
  @Input() rounded: boolean = false;
  @Input() circle: boolean = false;

  getLines(): number[] {
    return Array(this.lines).fill(0);
  }

  getLineWidth(index: number): string {
    if (index === this.lines - 1 && this.lines > 1) {
      return '70%';
    }
    return '100%';
  }
}
