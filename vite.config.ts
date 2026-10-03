import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  const rawUrl = (
    env.VITE_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();

  const rawAnonKey = (
    env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  const isUrl = (str: string) => str.startsWith('http://') || str.startsWith('https://');

  let resolvedUrl = rawUrl;
  let resolvedAnonKey = rawAnonKey;

  if (isUrl(rawUrl)) {
    resolvedUrl = rawUrl;
    resolvedAnonKey = rawAnonKey;
  } else if (isUrl(rawAnonKey)) {
    // Correct swapped environment variables if URL was assigned to ANON_KEY
    resolvedUrl = rawAnonKey;
    resolvedAnonKey = rawUrl;
  } else {
    resolvedUrl = 'https://fxuyajecvbgtqdfiyvcm.supabase.co';
    resolvedAnonKey = rawAnonKey;
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    // Ensure production Vercel builds receive the VITE_ variables statically inlined
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(resolvedUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(resolvedAnonKey),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
