// A session's avatar: its initials inside the ring that tells its status at a glance.

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Ring } from '../../L1_domain/home';

@Component({
  selector: 'app-avatar',
  template: '{{ label() }}',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'av',
    '[class.needs]': "ring() === 'needs'",
    '[class.work]': "ring() === 'work'",
    '[class.done]': "ring() === 'done'",
    '[class.idle]': "ring() === 'idle'",
    '[class.sh]': 'shell()',
  },
})
export class AvatarComponent {
  readonly label = input.required<string>();
  readonly ring = input.required<Ring>();
  /** A console, drawn as a terminal rather than as an agent. */
  readonly shell = input(false);
}
