const fs = require('fs');
const path = require('path');

const directories = [
    path.join(__dirname, 'features'),
    path.join(__dirname, 'components'),
    path.join(__dirname, 'pages'),
];
const rootFiles = [
    path.join(__dirname, 'App.tsx'),
];

function walkDir(dir) {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    let results = [];
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(fullPath);
        }
    }
    return results;
}

let allFiles = [...rootFiles];
for (const dir of directories) {
    allFiles = allFiles.concat(walkDir(dir));
}

let modifiedCount = 0;

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let original = content;

    // Text Colors
    content = content.replace(/text-(slate|gray|neutral|zinc)-900(?!\s+dark:text-)/g, 'text-$1-900 dark:text-white');
    content = content.replace(/text-(slate|gray|neutral|zinc)-800(?!\s+dark:text-)/g, 'text-$1-800 dark:text-slate-100');
    content = content.replace(/text-(slate|gray|neutral|zinc)-700(?!\s+dark:text-)/g, 'text-$1-700 dark:text-slate-200');
    content = content.replace(/text-(slate|gray|neutral|zinc)-600(?!\s+dark:text-)/g, 'text-$1-600 dark:text-slate-300');
    content = content.replace(/text-(slate|gray|neutral|zinc)-500(?!\s+dark:text-)/g, 'text-$1-500 dark:text-slate-400');

    // Colored Text
    content = content.replace(/text-indigo-900(?!\s+dark:text-)/g, 'text-indigo-900 dark:text-indigo-100');
    content = content.replace(/text-indigo-800(?!\s+dark:text-)/g, 'text-indigo-800 dark:text-indigo-200');
    content = content.replace(/text-indigo-700(?!\s+dark:text-)/g, 'text-indigo-700 dark:text-indigo-300');
    content = content.replace(/text-indigo-600(?!\s+dark:text-)/g, 'text-indigo-600 dark:text-indigo-400');

    content = content.replace(/text-rose-900(?!\s+dark:text-)/g, 'text-rose-900 dark:text-rose-100');
    content = content.replace(/text-rose-800(?!\s+dark:text-)/g, 'text-rose-800 dark:text-rose-200');
    content = content.replace(/text-rose-700(?!\s+dark:text-)/g, 'text-rose-700 dark:text-rose-300');
    content = content.replace(/text-rose-600(?!\s+dark:text-)/g, 'text-rose-600 dark:text-rose-400');

    content = content.replace(/text-emerald-900(?!\s+dark:text-)/g, 'text-emerald-900 dark:text-emerald-100');
    content = content.replace(/text-emerald-800(?!\s+dark:text-)/g, 'text-emerald-800 dark:text-emerald-200');
    content = content.replace(/text-emerald-700(?!\s+dark:text-)/g, 'text-emerald-700 dark:text-emerald-300');
    content = content.replace(/text-emerald-600(?!\s+dark:text-)/g, 'text-emerald-600 dark:text-emerald-400');

    content = content.replace(/text-amber-900(?!\s+dark:text-)/g, 'text-amber-900 dark:text-amber-100');
    content = content.replace(/text-amber-800(?!\s+dark:text-)/g, 'text-amber-800 dark:text-amber-200');
    content = content.replace(/text-amber-700(?!\s+dark:text-)/g, 'text-amber-700 dark:text-amber-300');
    content = content.replace(/text-amber-600(?!\s+dark:text-)/g, 'text-amber-600 dark:text-amber-400');

    // Backgrounds - neutral
    content = content.replace(/bg-white(?!\s+dark:bg-)/g, 'bg-white dark:bg-slate-900');
    content = content.replace(/bg-slate-50(?!\s+dark:bg-)/g, 'bg-slate-50 dark:bg-slate-800');
    content = content.replace(/bg-slate-100(?!\s+dark:bg-)/g, 'bg-slate-100 dark:bg-slate-800');
    content = content.replace(/bg-slate-200(?!\s+dark:bg-)/g, 'bg-slate-200 dark:bg-slate-700');

    // Borders - neutral
    content = content.replace(/border-slate-50(?!\s+dark:border-)/g, 'border-slate-50 dark:border-slate-800');
    content = content.replace(/border-slate-100(?!\s+dark:border-)/g, 'border-slate-100 dark:border-slate-800');
    content = content.replace(/border-slate-200(?!\s+dark:border-)/g, 'border-slate-200 dark:border-slate-700');
    content = content.replace(/border-slate-300(?!\s+dark:border-)/g, 'border-slate-300 dark:border-slate-600');

    // Colored Backgrounds (often used in badges)
    content = content.replace(/bg-indigo-50(?!\s+dark:bg-)/g, 'bg-indigo-50 dark:bg-indigo-900/20');
    content = content.replace(/bg-rose-50(?!\s+dark:bg-)/g, 'bg-rose-50 dark:bg-rose-500/10');
    content = content.replace(/bg-emerald-50(?!\s+dark:bg-)/g, 'bg-emerald-50 dark:bg-emerald-500/10');
    content = content.replace(/bg-amber-50(?!\s+dark:bg-)/g, 'bg-amber-50 dark:bg-amber-500/10');
    content = content.replace(/bg-orange-50(?!\s+dark:bg-)/g, 'bg-orange-50 dark:bg-orange-500/10');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf-8');
        modifiedCount++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Modified ${modifiedCount} files.`);
