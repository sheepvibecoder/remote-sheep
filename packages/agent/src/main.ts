// Composition root: the only file that knows which adapters plug into the core.

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeBase64Url, publicKeyId } from '@remote-sheep/protocol';
import pkg from '../package.json' with { type: 'json' };
import { PairingLinks } from './L1_domain/pairing-links';
import { PairingService } from './L2_application/pairing-service';
import { PushNotifier } from './L2_application/push-notifier';
import { SessionHub } from './L2_application/session-hub';
import { chooseListenPort } from './L2_application/choose-listen-port';
import { portFromVariable, presetListenPort } from './L1_domain/listen-port';
import { BackgroundAgent, nodeAgentProcesses } from './L3_periphery/background/background-agent';
import { SecureChannel } from './L3_periphery/channel/secure-channel';
import { parseArguments, USAGE } from './L3_periphery/cli/cli-arguments';
import { formatDevices } from './L3_periphery/cli/device-table';
import { BACKGROUND_PAIRING_HINT, describePairing } from './L3_periphery/cli/pairing-messages';
import { showPairingPrompt } from './L3_periphery/cli/pairing-prompt';
import { busyPortHint, describePort } from './L3_periphery/cli/port-messages';
import { requestPairing } from './L3_periphery/control/control-client';
import { removeControlFile, saveControlFile } from './L3_periphery/control/control-file';
import { HttpControlServer } from './L3_periphery/control/http-control-server';
import { ClaudeTranscripts } from './L3_periphery/claude/claude-transcripts';
import { loadAgentKeyPair, readAgentPublicKey } from './L3_periphery/files/file-agent-identity';
import { FileDeviceRegistry } from './L3_periphery/files/file-device-registry';
import { FileSavedPort } from './L3_periphery/files/file-saved-port';
import { loadShellSetting } from './L3_periphery/files/file-shell-setting';
import { loadVapidKeys } from './L3_periphery/files/file-vapid-keys';
import { FileUploadStore } from './L3_periphery/files/file-upload-store';
import { HerdrMultiplexer, herdrRunner } from './L3_periphery/herdr/herdr-multiplexer';
import { LanTransport } from './L3_periphery/lan/lan-transport';
import { TcpPortProbe } from './L3_periphery/lan/tcp-port-probe';
import { WebPushSender } from './L3_periphery/push/web-push-sender';
import { relayPushWarning } from './L3_periphery/relay/relay-settings';
import {
  loadRelaySettingsFile,
  maskCode,
  removeRelaySettingsFile,
  saveRelaySettingsFile,
} from './L3_periphery/relay/relay-settings-file';
import { RelayTransport } from './L3_periphery/relay/relay-transport';
import { config } from './config';

function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .flatMap((i) => (i?.family === 'IPv4' && !i.internal ? [i.address] : []));
}

const clock = { now: () => Date.now() };
const random = { bytes: (length: number) => new Uint8Array(randomBytes(length)) };

async function createPushNotifier(
  registry: FileDeviceRegistry,
  subject: string,
  agentId: string,
  log: (message: string) => void,
) {
  const vapid = await loadVapidKeys(config.vapidFile);
  return new PushNotifier({
    registry,
    sender: new WebPushSender({ vapid, subject }),
    clock,
    publicKey: encodeBase64Url(vapid.publicKey),
    agentId,
    log,
  });
}

async function serve(registry: FileDeviceRegistry, background: boolean) {
  const keys = await loadAgentKeyPair(config.agentKeyFile);
  const shells = await loadShellSetting(config.settingsFile);
  const pairing = new PairingService({ registry, clock, random, agentKey: keys.publicKey });
  const tls =
    existsSync(config.certFile) && existsSync(config.keyFile)
      ? { cert: readFileSync(config.certFile), key: readFileSync(config.keyFile) }
      : undefined;
  const log = (message: string) => console.error(message);

  // Push needs the relay: its https origin is the VAPID subject and the page that can
  // register a service worker. Without one there is no notifier and phones are told why.
  const pushWarning = relayPushWarning(config.relay);
  if (pushWarning) log(pushWarning);
  const push = config.relay
    ? await createPushNotifier(registry, config.relay.url, publicKeyId(keys.publicKey), log)
    : undefined;

  const hub = new SessionHub({
    multiplexer: new HerdrMultiplexer(herdrRunner(config.herdr)),
    transcripts: new ClaudeTranscripts({
      sessionsDir: config.claudeSessionsDir,
      projectsDir: config.claudeProjectsDir,
      tailBytes: config.tailBytes,
      maxMessages: config.maxMessages,
    }),
    uploads: new FileUploadStore(config.uploadsDir, config.maxUploadBytes),
    devices: pairing,
    listIntervalMs: config.listIntervalMs,
    terminalIntervalMs: config.terminalIntervalMs,
    debounceMs: config.debounceMs,
    shells,
    notifier: push,
    push,
    log,
  });

  const channel = new SecureChannel({
    keys,
    pairing,
    version: pkg.version,
    events: hub,
    checkIntervalMs: config.pairingCheckIntervalMs,
    log,
  });
  const { port, source } = await chooseListenPort({
    variable: portFromVariable(config.portVariable),
    saved: new FileSavedPort(config.portFile),
    probe: new TcpPortProbe(),
  });
  const transport = new LanTransport({
    port,
    appDir: join(dirname(fileURLToPath(import.meta.url)), 'app'),
    tls,
    busyHint: busyPortHint(source),
  });
  await transport.start((link) => channel.accept(link));

  // The relay serves the app too, so its address leads the QR code; the LAN stays listed.
  const relay = config.relay
    ? new RelayTransport({
        url: config.relay.url,
        code: config.relay.code,
        room: publicKeyId(keys.publicKey),
        log,
        onState: (state) => log('relay ' + state + ' (' + config.relay?.url + ')'),
      })
    : null;
  await relay?.start((link) => channel.accept(link));

  const scheme = tls ? 'https' : 'http';
  const links = new PairingLinks(
    {
      relay: config.relay?.url ?? null,
      network: lanAddresses().map((address) => scheme + '://' + address + ':' + String(port)),
      local: scheme + '://127.0.0.1:' + String(port),
    },
    pairing,
  );
  const interactive = !background && process.stdin.isTTY;

  // Same PC only: `remote-sheep qr` asks here for a new pairing while the agent keeps running.
  const control = new HttpControlServer(links);
  await saveControlFile(config.controlFile, {
    port: await control.start(),
    secret: control.secret,
  });

  const printInvite = async () => {
    console.log('');
    console.log(await describePairing(links.newPairing()));
    if (interactive) console.log('Press Enter for a new QR code (the previous one stops working).');
  };

  console.log(
    'remote-sheep ' + pkg.version + ' is listening on port ' + String(port) + ' over ' + scheme,
  );
  if (!tls) {
    console.log('Serving over plain http: frames are end-to-end encrypted, but someone on this');
    console.log('network could alter the page itself. Put cert.pem and key.pem in ' + config.home);
    console.log('to serve over https.');
  }
  console.log(
    shells.enabled()
      ? 'Consoles are on: paired phones can open a shell here and run any command. Turn them off in the app, under Settings.'
      : 'Consoles are off. Turn them on in the app, under Settings.',
  );
  console.log('Paired phones: `remote-sheep devices`; unpair one: `remote-sheep revoke <id>`.');
  console.log(background ? 'Stop with `remote-sheep stop`.' : 'Stop with Ctrl+C.');
  // In the background the output is agent.log: a pairing link there would be a live credential.
  if (background) console.log(BACKGROUND_PAIRING_HINT);
  else await printInvite();

  if (interactive) {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', () => {
      printInvite().catch((err: unknown) => {
        log('could not print a QR code: ' + String(err));
      });
    });
  }

  const shutdown = async () => {
    hub.stop();
    await control.stop();
    await removeControlFile(config.controlFile, control.secret);
    await relay?.stop();
    await transport.stop();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

const RESTART =
  'Restart the agent to use it: `remote-sheep stop`, then `remote-sheep start` (or restart Herdr).';

function backgroundAgent() {
  return new BackgroundAgent({
    dir: config.home,
    // The built bundle starts itself again, from its data folder: a plugin's working folder
    // on Windows is a \\?\ path that Node cannot resolve modules from.
    processes: nodeAgentProcesses(fileURLToPath(import.meta.url), config.home),
  });
}

async function main() {
  const command = parseArguments(process.argv.slice(2));
  const registry = new FileDeviceRegistry(config.devicesFile);
  switch (command.kind) {
    case 'help':
      console.log(USAGE);
      return;
    case 'error':
      console.error('remote-sheep: ' + command.message + '\n\n' + USAGE);
      process.exitCode = 2;
      return;
    case 'devices':
      console.log(formatDevices(await registry.list(), clock.now()));
      return;
    case 'revoke':
      if (await registry.remove(command.id)) {
        console.log('Revoked ' + command.id + '. A running agent disconnects it within 5 seconds.');
      } else {
        console.error('No paired phone has the id ' + command.id + '; see `remote-sheep devices`.');
        process.exitCode = 1;
      }
      return;
    case 'relay-set': {
      const saved = await saveRelaySettingsFile(config.relayFile, command.url, command.code);
      console.log('Relay saved: ' + saved.url + '. From now on the agent connects through it.');
      return;
    }
    case 'relay-show': {
      const saved = loadRelaySettingsFile(config.relayFile);
      console.log(
        saved
          ? 'Relay: ' + saved.url + ' (code ' + maskCode(saved.code) + ')'
          : 'No relay set; the agent serves the local network only.',
      );
      return;
    }
    case 'relay-off':
      console.log(
        (await removeRelaySettingsFile(config.relayFile))
          ? 'Relay forgotten. The agent serves the local network only.'
          : 'No relay was set.',
      );
      return;
    case 'port-show': {
      const saved = await new FileSavedPort(config.portFile).load();
      const variable = portFromVariable(config.portVariable);
      console.log(describePort({ variable, saved, file: config.portFile }));
      const status = await backgroundAgent().status();
      if (status.kind === 'running') console.log(status.message);
      return;
    }
    case 'port-set':
      await new FileSavedPort(config.portFile).save(command.port);
      console.log('Port ' + String(command.port) + ' saved. ' + RESTART);
      if (
        presetListenPort(portFromVariable(config.portVariable), command.port)?.source === 'variable'
      ) {
        console.log('PORT is set, though, and overrides it while it stays set.');
      }
      return;
    case 'port-auto':
      console.log(
        (await new FileSavedPort(config.portFile).forget())
          ? 'Saved port forgotten: the next start picks a free one and saves it. ' + RESTART
          : 'No port was saved; the next start picks a free one and saves it.',
      );
      return;
    case 'serve':
      await serve(registry, command.background);
      return;
    case 'qr':
      await showPairingPrompt({
        request: async () =>
          requestPairing({
            controlFile: config.controlFile,
            agentKey: await readAgentPublicKey(config.agentKeyFile),
          }),
        input: process.stdin,
        output: {
          clear: () => {
            console.clear();
          },
          print: (text) => {
            console.log(text);
          },
        },
      });
      return;
    case 'start': {
      const result = await backgroundAgent().start();
      (result.kind === 'failed' ? console.error : console.log)(result.message);
      if (result.kind === 'failed') process.exitCode = 1;
      return;
    }
    case 'stop':
      console.log((await backgroundAgent().stop()).message);
      return;
    case 'status':
      console.log((await backgroundAgent().status()).message);
      return;
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
