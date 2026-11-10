import { build } from 'esbuild';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const js = await build({
  entryPoints: ['scripts/portable-ledger.ts'],
  bundle: true,
  minify: true,
  write: false,
  format: 'iife',
  define: { ngDevMode: 'false' },
  legalComments: 'inline',
  plugins: [
    {
      name: 'inline-angular-resources',
      setup(b) {
        b.onLoad({ filter: /portfolio\.component\.ts$/ }, async ({ path }) => {
          const source = await readFile(path, 'utf8');
          const html = await readFile(
            resolve(dirname(path), 'portfolio.component.html'),
            'utf8',
          );
          const css = await readFile(
            resolve(dirname(path), 'portfolio.component.css'),
            'utf8',
          );
          return {
            loader: 'ts',
            contents: source
              .replace(
                "templateUrl: './portfolio.component.html'",
                () => 'template: ' + JSON.stringify(html),
              )
              .replace(
                "styleUrls: ['./portfolio.component.css']",
                () => 'styles: [' + JSON.stringify(css) + ']',
              ),
          };
        });
      },
    },
  ],
});
const styles = await build({
  stdin: {
    contents:
      '@import "primeng/resources/themes/bootstrap4-light-blue/theme.css"; @import "primeng/resources/primeng.min.css";',
    loader: 'css',
    resolveDir: process.cwd(),
  },
  bundle: true,
  minify: true,
  write: false,
  loader: { '.woff2': 'dataurl', '.woff': 'dataurl', '.png': 'dataurl' },
  legalComments: 'inline',
});
const html =
  '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; script-src &apos;unsafe-inline&apos; &apos;unsafe-eval&apos;; style-src &apos;unsafe-inline&apos;; img-src data: blob:; font-src data:; connect-src &apos;none&apos;; form-action &apos;none&apos;; base-uri &apos;none&apos;"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Domain Locker · 域名台账</title><style>' +
  styles.outputFiles[0].text +
  'body{margin:0 auto;padding:clamp(.75rem,3vw,2rem);max-width:100rem;background:var(--surface-ground);color:var(--text-color);font-family:var(--font-family)}</style></head><body><form id="unlock" style="max-width:28rem;margin:10vh auto;display:grid;gap:1rem"><h1>Domain Locker</h1><p role="status"></p><label>Password · 密码 <input required type="password" name="password"></label><label hidden>Confirm · 确认密码 <input type="password" name="confirm" autocomplete="new-password"></label><button disabled>Unlock · 打开台账</button></form><app-portfolio></app-portfolio><script>' +
  js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script') +
  '</script></body></html>';
await mkdir('dist/portable', { recursive: true });
await writeFile('dist/portable/domain-ledger.html', html);
