const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/azure-sdks.js'],
  bundle: true,
  outfile: 'public/dist/bundle.js',
  format: 'esm',
  platform: 'browser',  // ← CRITICAL: Target browser
  target: ['es2020'],
  minify: true,
}).then(() => console.log('✅ Azure SDKs bundled for browser!'))
  .catch((error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });