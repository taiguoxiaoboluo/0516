import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));

export function showSchema() {
  const schemaPath = join(currentDir, '..', '..', 'references', 'schema.md');
  const content = readFileSync(schemaPath, 'utf-8');
  console.log(content);
}
