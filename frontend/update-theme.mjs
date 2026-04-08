import fs from 'fs';
import path from 'path';

const DIR = './src';

const replacements = [
  { search: /(?<!dark:)bg-\[\#121212\]/g, replace: 'bg-white dark:bg-[#121212]' },
  { search: /(?<!dark:)bg-\[\#0a0a0a\]/g, replace: 'bg-slate-50 dark:bg-[#0a0a0a]' },
  { search: /(?<!dark:)bg-\[\#1a1a1a\]/g, replace: 'bg-white dark:bg-[#1a1a1a]' },
  { search: /(?<!dark:)bg-black\/40/g, replace: 'bg-white/80 dark:bg-black/40' },
  { search: /(?<!dark:)bg-black\/50/g, replace: 'bg-white/90 dark:bg-black/50' },
  { search: /(?<!dark:)bg-black\/60/g, replace: 'bg-white dark:bg-black/60' },
  { search: /(?<!dark:)bg-white\/5/g, replace: 'bg-black/5 dark:bg-white/5' },
  { search: /(?<!dark:)bg-white\/10/g, replace: 'bg-black/10 dark:bg-white/10' },
  { search: /(?<!dark:)border-white\/5/g, replace: 'border-black/5 dark:border-white/5' },
  { search: /(?<!dark:)border-white\/10/g, replace: 'border-black/10 dark:border-white/10' },
  { search: /(?<!dark:)text-white/g, replace: 'text-slate-900 dark:text-white' },
  { search: /(?<!dark:)text-slate-100/g, replace: 'text-slate-800 dark:text-slate-100' },
  { search: /(?<!dark:)text-slate-300/g, replace: 'text-slate-700 dark:text-slate-300' },
  { search: /(?<!dark:)text-slate-400/g, replace: 'text-slate-600 dark:text-slate-400' },
  { search: /(?<!dark:)from-black\/80/g, replace: 'from-white/80 dark:from-black/80' },
  { search: /(?<!dark:)via-\[\#0a0a0a\]\/90/g, replace: 'via-slate-50/90 dark:via-[#0a0a0a]/90' },
  { search: /(?<!dark:)to-black/g, replace: 'to-white dark:to-black' },
];

function processDir(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            for (const {search, replace} of replacements) {
                content = content.replace(search, replace);
            }
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDir(DIR);
