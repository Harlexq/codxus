// MJML kaynaklarini HTML'e derler.
//
// Neden build zamaninda? mjml ~30 MB'lik bir bagimlilik ve yalnizca
// derleme icin gerekli. Build'de calistirip ciktiyi kopyalayinca prod
// imajinda mjml hic bulunmuyor, acilista derleme maliyeti de yok.
// Bu yuzden mjml devDependencies'te.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import mjml2html from 'mjml';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const templateRoot = path.join(scriptDir, '..', 'src', 'providers', 'mail', 'templates');
const sourceDir = path.join(templateRoot, 'src');
const outputDir = path.join(templateRoot, 'compiled');

fs.mkdirSync(outputDir, { recursive: true });

const sources = fs
  .readdirSync(sourceDir)
  .filter((file) => file.endsWith('.mjml'));

if (sources.length === 0) {
  console.error(`Sablon bulunamadi: ${sourceDir}`);
  process.exit(1);
}

let hasError = false;

for (const file of sources) {
  const sourcePath = path.join(sourceDir, file);

  // mjml 5 ile mjml2html artik Promise donuyor (4'te senkrondu).
  const { html, errors } = await mjml2html(
    fs.readFileSync(sourcePath, 'utf-8'),
    {
      filePath: sourcePath,
      // strict: gecersiz MJML sessizce bozuk HTML uretmesin, build patlasin.
      validationLevel: 'strict',
    },
  );

  if (errors.length > 0) {
    hasError = true;
    for (const error of errors) {
      console.error(`${file}: ${error.formattedMessage ?? error.message}`);
    }
    continue;
  }

  const outputPath = path.join(outputDir, file.replace(/\.mjml$/, '.html'));
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`derlendi: ${file} -> ${path.basename(outputPath)}`);
}

if (hasError) {
  process.exit(1);
}
