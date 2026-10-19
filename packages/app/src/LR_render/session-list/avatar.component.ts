// A session's avatar: its initials inside the ring that tells its status at a glance. A workspace
// gets a folder instead, with no ring: it is a place, not something that works.

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Ring } from '../../L1_domain/home';

@Component({
  selector: 'app-avatar',
  template: `
    @if (folder()) {
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
        />
      </svg>
    } @else {
      {{ label() }}
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'av',
    '[class.needs]': "ring() === 'needs'",
    '[class.work]': "ring() === 'work'",
    '[class.done]': "ring() === 'done'",
    '[class.idle]': "ring() === 'idle'",
    '[class.sh]': 'shell()',
    '[class.sq]': 'folder()',
  },
})
export class AvatarComponent {
  readonly label = input.required<string>();
  readonly ring = input.required<Ring>();
  /** A console, drawn as a terminal rather than as an agent. */
  readonly shell = input(false);
  /** A workspace, drawn as a folder. */
  readonly folder = input(false);
}
