// Genera dist/artifact.html: un solo archivo con todo el CSS y JS incrustado.
// Lee index.html para saber qué estilos y scripts incluir, así index.html sigue siendo la única fuente.
// Uso:  node tools/build-artifact.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'Variedades Jesly';
const fonts = (html.match(/<link href="(https:\/\/fonts\.googleapis\.com[^"]+)"/) || [])[1];
const cssFiles = [...html.matchAll(/<link rel="stylesheet" href="(css\/[^"]+)"/g)].map(m => m[1]);
const jsFiles = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map(m => m[1]);
const bodyDivs = [...html.matchAll(/<div id="[^"]+"[^>]*><\/div>/g)].map(m => m[0]).join('\n');

const read = f => readFileSync(join(root, f), 'utf8');
const css = cssFiles.map(f => `/* ${f} */\n${read(f)}`).join('\n');
const js = jsFiles.map(f => `/* ${f} */\n${read(f)}`).join('\n');
if (/<\/script/i.test(js)) throw new Error('Un archivo JS contiene "</script"; no se puede incrustar.');

const out = `<title>${title}</title>
${fonts ? `<link rel="stylesheet" href="${fonts}">` : ''}
<style>
${css}
</style>
${bodyDivs}
<script>window.VJ_PREVIEW = true; /* oculta funciones que no existen en la vista previa (imprimir) */</script>
<script>
${js}
</script>
`;
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'artifact.html'), out);
console.log(`dist/artifact.html  ${(out.length / 1024).toFixed(0)} KB  (${cssFiles.length} css, ${jsFiles.length} js)`);
