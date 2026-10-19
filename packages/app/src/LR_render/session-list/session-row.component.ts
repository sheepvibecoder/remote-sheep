// One row of the list, laid out like a chat in a messaging app: avatar, title and time, one
// line of what the session is doing, and the folder with the agent that runs there.

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ListRow } from '../../L1_domain/home';
import { AvatarComponent } from './avatar.component';

@Component({
  selector: 'app-session-row',
  imports: [AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="card"
      [class.sel]="selected()"
      [class.unread]="row().unread > 0"
      (click)="open.emit(row().key)"
    >
      <app-avatar
        [label]="row().avatar"
        [ring]="row().ring"
        [shell]="row().shell"
        [folder]="row().folder"
      />
      <span class="who">
        <span class="l1">
          <span class="t">{{ row().title }}</span>
          @if (row().time) {
            <span class="tm" [class.ask]="row().asks">{{ row().time }}</span>
          }
        </span>
        <span class="l2">
          <span class="s" [class.ask]="row().asks">{{ row().line }}</span>
          @if (row().unread > 0) {
            <span class="badge">{{ row().unread }}</span>
          }
        </span>
        <span class="sp">
          {{ row().place }}
          @if (row().agent; as agent) {
            · <span class="agent-tag" [attr.data-agent]="agent"><i></i>{{ agent }}</span>
          }
        </span>
      </span>
    </button>
  `,
})
export class SessionRowComponent {
  readonly row = input.required<ListRow>();
  /** Open beside the list, on a wide window. */
  readonly selected = input(false);
  readonly open = output<string>();
}
