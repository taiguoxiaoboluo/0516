#!/usr/bin/env node

import { Command } from 'commander';
import { extract } from '../lib/extract/from-url.js';
import { toPromptMarkdown } from '../lib/generate/to-prompt-md.js';
import { showSchema } from '../lib/schema/show-schema.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const program = new Command();

program
  .name('style-sniffer')
  .description('🐕‍🦺 Extract visual design DNA into structured style prompts')
  .version('0.1.0');

program
  .command('sniff <url>')
  .description('Extract design style from a URL')
  .option('--json-only', 'Output raw JSON to terminal')
  .option('--save', 'Save results to output/ directory')
  .option('--prompt', 'Also generate a style prompt markdown file')
  .option('--css', 'Also generate CSS variables file')
  .option('--dark-mode', 'Extract dark mode variant')
  .option('--mobile', 'Use mobile viewport (390x844)')
  .action(async (url, options) => {
    console.log('🐕‍🦺 Style Sniffer is sniffing...\n');
    console.log(`   Target: ${url}`);
    console.log(`   Options: ${JSON.stringify(options)}\n`);

    try {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const result = await extract(normalizedUrl, options);

      if (options.jsonOnly) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      printSummary(result);

      if (options.save) {
        saveOutput(normalizedUrl, result, options);
      }
    } catch (error) {
      console.error(`\n❌ Extraction failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('schema')
  .description('Show the full Style Sniffer schema')
  .action(() => {
    showSchema();
  });

program
  .command('generate <jsonFile>')
  .description('Generate style prompt from a JSON profile')
  .option('--format <type>', 'Output format: prompt | css | html', 'prompt')
  .option('--save', 'Save to output/ directory')
  .action(async (jsonFile, options) => {
    try {
      const { readFileSync } = await import('fs');
      const jsonContent = readFileSync(jsonFile, 'utf-8');
      const profile = JSON.parse(jsonContent);

      if (options.format === 'prompt' || options.format === 'all') {
        const promptMd = toPromptMarkdown(profile);
        if (options.save) {
          const outputPath = jsonFile.replace('.json', '-prompt.md');
          writeFileSync(outputPath, promptMd, 'utf-8');
          console.log(`✅ Style prompt saved to: ${outputPath}`);
        } else {
          console.log(promptMd);
        }
      }
    } catch (error) {
      console.error(`\n❌ Generation failed: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();

function printSummary(result) {
  console.log('━'.repeat(50));
  console.log('🎨 Extraction Summary');
  console.log('━'.repeat(50));

  if (result.meta) {
    console.log(`\n📛 Name: ${result.meta.name || 'Unknown'}`);
    console.log(`📝 Description: ${result.meta.description || '-'}`);
  }

  if (result.design_tokens?.colors) {
    const colors = result.design_tokens.colors;
    console.log('\n🎨 Colors:');
    console.log(`   Background: ${colors.background || '-'}`);
    console.log(`   Foreground: ${colors.foreground || '-'}`);
    console.log(`   Primary:    ${colors.primary?.hex || '-'}`);
    console.log(`   Secondary:  ${colors.secondary?.hex || '-'}`);
    console.log(`   Accent:     ${colors.accent?.hex || '-'}`);
  }

  if (result.design_tokens?.typography) {
    const typo = result.design_tokens.typography;
    console.log('\n🔤 Typography:');
    console.log(`   Heading: ${typo.heading_font || '-'}`);
    console.log(`   Body:    ${typo.body_font || '-'}`);
  }

  if (result.design_style?.aesthetic) {
    const aesthetic = result.design_style.aesthetic;
    console.log('\n✨ Style:');
    console.log(`   Mood:  ${aesthetic.mood?.join(', ') || '-'}`);
    console.log(`   Genre: ${aesthetic.genre || '-'}`);
  }

  console.log('\n' + '━'.repeat(50));
}

function saveOutput(url, result, options) {
  const hostname = new URL(url).hostname;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = join(process.cwd(), 'output', hostname);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const jsonPath = join(outputDir, `${timestamp}.json`);
  writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n💾 JSON saved to: ${jsonPath}`);

  if (options.prompt) {
    const promptMd = toPromptMarkdown(result);
    const mdPath = join(outputDir, `${timestamp}-prompt.md`);
    writeFileSync(mdPath, promptMd, 'utf-8');
    console.log(`📝 Prompt saved to: ${mdPath}`);
  }
}
