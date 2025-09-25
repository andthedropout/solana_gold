import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: (() => {
    const base = process.env.NODE_ENV === 'production' ? '/static/' : '/';
    console.log(`🏗️ Vite config - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`🏗️ Vite config - Base path: ${base}`);
    return base;
  })(),
  server: {
    host: true,
    port: parseInt(process.env.VITE_PORT || "5173", 10),
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          "*": ""
        }
      },
      '/public': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },

  plugins: [
    react(),
    splitVendorChunkPlugin(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // generate manifest.json in outDir
    manifest: true,
    
    // Ensure index.html is copied to output
    outDir: 'dist',
    emptyOutDir: true,

    rollupOptions: {
      // https://rollupjs.org/configuration-options/

      // Use simple string to ensure index.html is processed
      input: 'index.html',

      output: {
        // Exclude 'assets/' prefix from file names since it's redundant.

        // Exclude hash from names for "entry" and "asset" files since Django
        // itself will add a hash to the file names for use in HTML templates.

        // entryFileNames: "assets/[name]-[hash].js", // default value in Vite
        entryFileNames: "[name].js",

        // assetFileNames: "assets/[name]-[hash].[ext]", // default value in Vite
        assetFileNames: "[name].[ext]",

        // Note that we include the hash for chunk files since they are 
        // imported by other JS files and not by Django HTML templates.
        // chunkFileNames: 'assets/[name]-[hash].js', // default value in Vite
        chunkFileNames: '[name]-[hash].js',
      },
    },
  },
})
