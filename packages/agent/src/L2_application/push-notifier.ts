// Decides who hears about a session that stopped working, and sends it.
//
// Every phone that is still trusted (its pairing has not expired; a removed device is
// gone from the registry) and has opted in gets a short notice: the session's project and
// its new state, nothing from the transcript. Whether somebody is already looking at the
// chat is the hub's call, which knows what each phone watches. A push service that says
// the subscription is gone loses it here, so the next session does not try again.

import type { Clock } from '../L1_domain/ports/clock';
import type { Device, DeviceRegistry } from '../L1_domain/ports/device-registry';
import type { Notifier, SessionChange } from '../L1_domain/ports/notifier';
import type { PushSubscription } from '@remote-sheep/protocol';
import type { PushSender } from '../L1_domain/ports/push-sender';
import { isPairingExpired } from '../L1_domain/pairing-expiry';

export interface PushNotifierOptions {
  registry: Pick<DeviceRegistry, 'list' | 'setPush'>;
  sender: PushSender;
  clock: Clock;
  /** The VAPID public key, base64url, which a phone needs to subscribe. */
  publicKey: string;
  /**
   * This agent's key id: a phone paired with several computers opens the right one
   * from a tapped notification, since pane ids repeat between computers.
   */
  agentId: string;
  log?: (message: string) => void;
}

const titleOf = (change: SessionChange): string =>
  change.session.project + (change.to === 'blocked' ? ': waiting for your answer' : ': finished');

export class PushNotifier implements Notifier {
  constructor(private readonly options: PushNotifierOptions) {}

  get publicKey(): string {
    return this.options.publicKey;
  }

  async subscribe(device: string, push: PushSubscription): Promise<void> {
    if (!(await this.options.registry.setPush(device, push))) {
      throw new Error('no paired device has the id ' + device);
    }
  }

  async unsubscribe(device: string): Promise<void> {
    await this.options.registry.setPush(device, null);
  }

  notify(change: SessionChange): void {
    // The monitor calls this from its timer and must not wait for the push services, so the
    // delivery runs on its own and reports its failures to the log.
    void this.deliver(change).catch((err: unknown) =>
      this.options.log?.('notifying failed: ' + (err instanceof Error ? err.message : String(err))),
    );
  }

  private async deliver(change: SessionChange): Promise<void> {
    const now = this.options.clock.now();
    const payload = JSON.stringify({
      title: titleOf(change),
      target: change.session.target,
      agent: this.options.agentId,
    });
    const devices = (await this.options.registry.list()).filter(
      (device) => device.push && !isPairingExpired(device, now),
    );
    await Promise.all(devices.map((device) => this.send(device, payload)));
  }

  private async send(device: Device, payload: string): Promise<void> {
    if (!device.push) return;
    try {
      if ((await this.options.sender.send(device.push, payload)) === 'gone') {
        await this.options.registry.setPush(device.id, null);
      }
    } catch (err) {
      this.options.log?.(
        'push to ' + device.id + ' failed: ' + (err instanceof Error ? err.message : String(err)),
      );
    }
  }
}
