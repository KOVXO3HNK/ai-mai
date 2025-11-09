// FIX: Replaced placeholder content with a valid Vite configuration.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This makes process.env available to the client code.
    // The environment variables are sourced from the execution environment.
    'process.env': process.env,
  },
});
