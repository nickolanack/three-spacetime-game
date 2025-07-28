import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";

export default defineConfig({
  plugins: [
    
    obfuscatorPlugin({
    
    }), 
    
    viteSingleFile()
    
    ],
 
  build: {
    target: 'esnext',
    assetsInlineLimit: Infinity,
  },
});