import { resolve } from 'path';
import { minify } from 'terser';
import { copyFileSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';

// Custom plugin to minify public JS files
export function minifyPublicJsPlugin(options?: {
  public?: string;
  dist?: string;
}) {
  return {
    name: 'minify-public-js',
    writeBundle() {
      const publicDir = resolve(__dirname, '../', options?.public || 'public');
      const distDir = resolve(__dirname, '../', options?.dist || 'dist');
      
      // Create dist/public directory if it doesn't exist
      try {
        mkdirSync(distDir, { recursive: true });
      } catch (error) {
        // Directory already exists
      }
      
      // Copy and minify JS files from public folder
      const files = readdirSync(publicDir);
      
      files.forEach(async (file) => {
        const filePath = resolve(publicDir, file);
        const stat = statSync(filePath);
        
        if (stat.isFile()) {
          const distFilePath = resolve(distDir, file);
          
          if (file.endsWith('.js')) {
            // Minify JavaScript files
            try {
              const code = readFileSync(filePath, 'utf8');
              const result = await minify(code, {
                compress: {
                  drop_console: false,
                  drop_debugger: true,
                },
                mangle: true,
                format: {
                  comments: false,
                }
              });
              
              writeFileSync(distFilePath, result.code || code);
              console.log(`Minified: ${file}`);
            } catch (error) {
              console.error(`Failed to minify ${file}:`, error);
              // Fallback: copy original file
              copyFileSync(filePath, distFilePath);
            }
          } else {
            // Copy non-JS files as-is
            copyFileSync(filePath, distFilePath);
          }
        }
      });
    }
  };
}
