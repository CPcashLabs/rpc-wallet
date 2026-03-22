
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const normalizeBasePath = (basePath?: string): string | undefined => {
  if (basePath === undefined) {
    return undefined;
  }

  if (basePath === '' || basePath === '/') {
    return '/';
  }

  return basePath.endsWith('/') ? basePath : `${basePath}/`;
};

export default defineConfig(({ command }) => {
  const isSingleFileBuild = command === 'build' && process.env.SINGLEFILE === '1';
  const buildBasePath = normalizeBasePath(process.env.BASE_PATH) ?? './';

  return {
    // Use relative asset paths in production builds so the site can be served from
    // subpaths like IPFS gateways (/ipfs/<cid>/) and GitHub Pages project sites.
    base: command === 'build' ? buildBasePath : '/',
    plugins: [react()],
    build: {
      // Single-file output is intentionally bundled into one JS asset,
      // so the default 500 kB warning threshold is too strict for this mode.
      chunkSizeWarningLimit: isSingleFileBuild ? 900 : 500,
      // Our single-file artifact targets modern Chromium/WebView runtimes.
      // Raising target here avoids extra transforms and shrinks bundle size a bit.
      target: isSingleFileBuild ? 'es2022' : undefined,
      cssCodeSplit: !isSingleFileBuild,
      assetsInlineLimit: isSingleFileBuild ? 1024 * 1024 * 100 : 4096,
      rollupOptions: {
        output: {
          inlineDynamicImports: isSingleFileBuild,
          ...(isSingleFileBuild
            ? {}
            : {
                manualChunks(id) {
                  if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                    return 'react-vendor';
                  }
                  if (id.includes('node_modules/ethers') || id.includes('node_modules/bs58')) {
                    return 'chain-vendor';
                  }
                  return undefined;
                }
              })
        }
      }
    },
    server: {
      port: 3000
    }
  };
});
