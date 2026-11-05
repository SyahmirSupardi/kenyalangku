import { build } from 'esbuild';

await build({
  entryPoints: ['src/standalone/home-project-folders.jsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  outfile: 'public/night-walk/project-folders-bundle.js',
  loader: { '.jsx': 'jsx' },
});
