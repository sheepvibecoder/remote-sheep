// The list of sessions, consoles or spaces. Rows are tracked by key, so a poll that changes
// one session redraws that row only and the list never flashes.

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { SessionListRow } from '../../L2_application/app.store';
import { SessionRowComponent } from './session-row.component';

@Component({
  selector: 'app-session-list',
  imports: [SessionRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (row of rows(); track row.key) {
      <app-session-row
        [row]="row"
        [selected]="row.key === selected()"
        (open)="open.emit($event)"
        (start)="start.emit($event)"
      />
    } @empty {
      <div class="hint">{{ hint() }}</div>
    }
  `,
})
export class SessionListComponent {
  // Empty until the view hands the first rows over, right after it mounts the list.
  readonly rows = input<readonly SessionListRow[]>([]);
  /** What an empty list says instead. */
  readonly hint = input('');
  /** The session open beside the list on a wide window. */
  readonly selected = input<string | null>(null);
  readonly open = output<string>();
  readonly start = output<string>();
}
