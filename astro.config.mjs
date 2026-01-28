import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless'; // Cambiamos node por vercel
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  adapter: vercel(), // Usamos el adaptador de vercel
  integrations: [react()],
});