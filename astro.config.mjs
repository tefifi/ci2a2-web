import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel'
import node from '@astrojs/node';
import react from '@astrojs/react';

// Vercel por defecto. El Dockerfile define DEPLOY_TARGET=node para compilar
// con el adaptador Node en modo standalone (servidor propio).
const adapter =
  process.env.DEPLOY_TARGET === 'node'
    ? node({ mode: 'standalone' })
    : vercel();

export default defineConfig({
  output: 'server',
  adapter,
  integrations: [react()],
});