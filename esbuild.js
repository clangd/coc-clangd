async function start() {
  await require('esbuild').build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    keepNames: true,
    sourcemap: process.env.NODE_ENV === 'development',
    mainFields: ['module', 'main'],
    external: ['coc.nvim'],
    platform: 'node',
    target: 'node16.18',
    outfile: 'lib/index.js',
  });
}

start().catch((e) => {
  console.error(e);
});