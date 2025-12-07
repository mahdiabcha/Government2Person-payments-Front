import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
          [ngClass]="toneClass(tone)">
      {{ text }}
    </span>
  `,
})
export class StatusChipComponent {
  @Input() text = '';
  @Input() tone: 'neutral'|'info'|'success'|'warning'|'error'|'accent' = 'neutral';

  toneClass(t: string) {
    return {
      'bg-gray-200 text-gray-800': t==='neutral',
      'bg-blue-200 text-blue-900': t==='info',
      'bg-green-200 text-green-900': t==='success',
      'bg-yellow-200 text-yellow-900': t==='warning',
      'bg-red-200 text-red-900': t==='error',
      'bg-indigo-200 text-indigo-900': t==='accent',
    };
  }
}
