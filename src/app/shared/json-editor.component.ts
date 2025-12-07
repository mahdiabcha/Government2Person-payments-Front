import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <textarea class="w-full h-64 border rounded p-2 font-mono text-sm"
              [(ngModel)]="valueStr"
              (ngModelChange)="onChange()"></textarea>
    <div class="text-sm mt-1" [ngClass]="{'text-red-600': error, 'text-green-700': !error}">
      {{ error ? 'Invalid JSON' : 'Valid JSON' }}
    </div>
  `,
})
export class JsonEditorComponent {
  @Input() value: any = {};
  @Output() valueChange = new EventEmitter<any>();
  valueStr = '';
  error = false;

  ngOnInit() { this.valueStr = JSON.stringify(this.value, null, 2); }
  onChange() {
    try {
      const parsed = JSON.parse(this.valueStr);
      this.error = false;
      this.valueChange.emit(parsed);
    } catch {
      this.error = true;
    }
  }
}
