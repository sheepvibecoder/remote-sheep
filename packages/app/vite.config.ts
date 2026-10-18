import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    {
      // What "Check for updates" compares against: the version this build is.
      name: 'version-json',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: pkg.version }),
        });
      },
    },
  ],
  define: {
    // Shown on screen so a stale cached page can be told apart from a fresh one.
    __VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      // The service worker is a second entry that must keep a fixed, unhashed name at the
      // root: the browser registers `/sw.js`, and a worker only controls its own folder down.
      input: { index: 'index.html', sw: 'sw/service-worker.ts' },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
  server: {
    // During development the page is served by Vite and the agent by itself.
    proxy: { '/ws': { target: 'ws://localhost:3999', ws: true } },
  },
});
