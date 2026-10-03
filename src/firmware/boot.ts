/**
 * Wizardo firmware-facing TypeScript runtime.
 * This is a portable boot/configuration layer for the CLI, not bare-metal
 * firmware. Hardware adapters can implement these interfaces without changing
 * command code.
 */
export type DeviceState = "offline" | "ready" | "fault";
export type Device = { id: string; driver: string; state: DeviceState };
export type BootManifest = { name: string; version: string; target: string; devices: Device[] };

export const manifest: BootManifest = {
  name: "wizardo-runtime",
  version: "1.0.0",
  target: "node-native",
  devices: [
    { id: "filesystem", driver: "native-fs", state: "ready" },
    { id: "terminal", driver: "stdio", state: "ready" },
    { id: "clock", driver: "system-clock", state: "ready" }
  ]
};

export function boot(): BootManifest {
  return structuredClone(manifest);
}
