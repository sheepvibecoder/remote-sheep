import type { PushSubscription } from '@remote-sheep/protocol';
import type { Device, DeviceRegistry } from '../../src/L1_domain/ports/device-registry';

/** In-memory registry with the same semantics as the file adapter. */
export class MemoryDeviceRegistry implements DeviceRegistry {
  devices = new Map<string, Device>();
  revoked = new Set<string>();
  touches: [string, number][] = [];

  async list() {
    return [...this.devices.values()];
  }
  async find(id: string) {
    return this.devices.get(id) ?? null;
  }
  async isRevoked(id: string) {
    return this.revoked.has(id);
  }
  async save(device: Device) {
    this.devices.set(device.id, device);
    this.revoked.delete(device.id);
  }
  async touch(id: string, at: number) {
    this.touches.push([id, at]);
    const device = this.devices.get(id);
    if (device) this.devices.set(id, { ...device, lastSeen: at });
  }
  async setPush(id: string, push: PushSubscription | null) {
    const device = this.devices.get(id);
    if (!device) return false;
    const { push: _old, ...rest } = device;
    this.devices.set(id, push ? { ...rest, push } : rest);
    return true;
  }
  async remove(id: string) {
    if (!this.devices.delete(id)) return false;
    this.revoked.add(id);
    return true;
  }
}
