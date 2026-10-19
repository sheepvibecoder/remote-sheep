// The list of sessions, consoles or spaces. Rows are tracked by key, so a poll that changes
// one session redraws that row only and the list never flashes.

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ListRow } from '../../L1_domain/home';
import { SessionRowComponent } from './session-row.component';

@Component({
  selector: 'app-session-list',
  imports: [SessionRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (row of rows(); track row.key) {
      <app-session-row [row]="row" (open)="open.emit($event)" />
    } @empty {
      <div class="hint">{{ hint() }}</div>
    }
  `,
})
export class SessionListComponent {
  // Empty until the view hands the first rows over, right after it mounts the list.
  readonly rows = input<readonly ListRow[]>([]);
  /** What an empty list says instead. */
  readonly hint = input('');
  readonly open = output<string>();
}
