#!/usr/bin/env tsx
/**
 * generate-og-images.ts
 * Pre-renders OG images (1200x630) for all episodes, essays, and objects.
 * Output: public/images/og/{type}-{slug}.png
 *
 * Usage: npm run og
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parse } from 'yaml';

// ---------------------------------------------------------------------------
// Frontmatter parser
// ---------------------------------------------------------------------------

function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  return parse(match[1]) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Font loader
// Tries known macOS system paths, then falls back to Arial.
// ---------------------------------------------------------------------------

interface SatoriFont {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: 'normal' | 'italic';
}

function loadFont(): SatoriFont {
  const candidates = [
    // macOS Supplemental
    '/System/Library/Fonts/Supplemental/Georgia.ttf',
    // macOS main fonts
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
    // Linux / CI
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return {
        name: candidate,
        data: readFileSync(candidate),
        weight: 400,
        style: 'normal',
      };
    }
  }

  throw new Error(
    'No system font found for Satori. Install a font at one of: ' + candidates.join(', '),
  );
}

// ---------------------------------------------------------------------------
// OG image renderer
// ---------------------------------------------------------------------------

async function generateOG(
  title: string,
  subtitle: string,
  outputPath: string,
  font: SatoriFont,
): Promise<void> {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          backgroundColor: '#faf8f5',
          fontFamily: 'Georgia, "Times New Roman", serif',
        },
        children: [
          {
            type: 'div',
            props: {
              children: title,
              style: {
                fontSize: 48,
                color: '#1a1a1a',
                lineHeight: 1.3,
                fontWeight: 400,
              },
            },
          },
          subtitle
            ? {
                type: 'div',
                props: {
                  children: subtitle,
                  style: {
                    fontSize: 20,
                    color: '#666666',
                    marginTop: 16,
                    textTransform: 'uppercase',
                    letterSpacing: 3,
                  },
                },
              }
            : null,
          {
            type: 'div',
            props: {
              style: {
                width: 80,
                height: 1,
                backgroundColor: '#e0dcd6',
                marginTop: 40,
                marginBottom: 20,
              },
            },
          },
          {
            type: 'div',
            props: {
              children: 'Object Lessons',
              style: {
                fontSize: 18,
                color: '#8a7e6e',
                letterSpacing: 2,
              },
            },
          },
        ].filter(Boolean),
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [font],
    },
  );

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const png = resvg.render().asPng();
  writeFileSync(outputPath, png);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const outDir = join(process.cwd(), 'public/images/og');
  mkdirSync(outDir, { recursive: true });

  const font = loadFont();
  console.log(`Using font from: ${font.name}`);

  const contentBase = join(process.cwd(), 'src/content');

  const collections = [
    { type: 'episode', dir: 'episodes', titleField: 'title', subtitleField: 'object' },
    { type: 'essay', dir: 'essays', titleField: 'title', subtitleField: 'object' },
    { type: 'object', dir: 'objects', titleField: 'name', subtitleField: null },
  ] as const;

  let generated = 0;
  let skipped = 0;

  for (const { type, dir, titleField, subtitleField } of collections) {
    const collectionDir = join(contentBase, dir);
    let files: string[];

    try {
      files = readdirSync(collectionDir).filter(f => f.endsWith('.mdx'));
    } catch {
      console.warn(`Warning: could not read collection directory "${collectionDir}" — skipping.`);
      skipped++;
      continue;
    }

    for (const file of files) {
      const content = readFileSync(join(collectionDir, file), 'utf-8');
      const fm = parseFrontmatter(content);
      const slug = basename(file, '.mdx');

      const title = (fm[titleField] as string) || slug;
      const subtitle = subtitleField ? ((fm[subtitleField] as string) || '') : '';
      const outPath = join(outDir, `${type}-${slug}.png`);

      await generateOG(title, subtitle, outPath, font);
      console.log(`Generated: ${type}-${slug}.png`);
      generated++;
    }
  }

  console.log(`\nDone. ${generated} image(s) generated, ${skipped} collection(s) skipped.`);
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
