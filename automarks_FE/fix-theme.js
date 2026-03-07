const fs = require('fs');
const path = require('path');

const directories = [
    'c:/Users/mkava/Desktop/projects/Auto_Marks/automarks_FE/features',
    'c:/Users/mkava/Desktop/projects/Auto_Marks/automarks_FE/components',
    'c:/Users/mkava/Desktop/projects/Auto_Marks/automarks_FE/pages',
];
const rootFiles = [
    'c:/Users/mkava/Desktop/projects/Auto_Marks/automarks_FE/App.tsx',
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

    // We look for className="..." or className={`...`} and check inside it.
    // Instead of parsing TSX, we can just replace text-color classes globally,
    // but if we do a simple regex, we must ensure it doesn't already have dark:text-

    // Process text-slate-900 -> text-slate-900 dark:text-white
    content = content.replace(/text-(slate|gray|neutral|zinc)-900(?!\s+dark:text-)/g, 'text-$1-900 dark:text-white');
    content = content.replace(/text-(slate|gray|neutral|zinc)-800(?!\s+dark:text-)/g, 'text-$1-800 dark:text-slate-100');
    content = content.replace(/text-(slate|gray|neutral|zinc)-700(?!\s+dark:text-)/g, 'text-$1-700 dark:text-slate-200');
    content = content.replace(/text-(slate|gray|neutral|zinc)-600(?!\s+dark:text-)/g, 'text-$1-600 dark:text-slate-300');
    content = content.replace(/text-(slate|gray|neutral|zinc)-500(?!\s+dark:text-)/g, 'text-$1-500 dark:text-slate-400');

    content = content.replace(/text-indigo-900(?!\s+dark:text-)/g, 'text-indigo-900 dark:text-indigo-100');
    content = content.replace(/text-indigo-800(?!\s+dark:text-)/g, 'text-indigo-800 dark:text-indigo-200');
    content = content.replace(/text-indigo-700(?!\s+dark:text-)/g, 'text-indigo-700 dark:text-indigo-300');

    content = content.replace(/text-rose-900(?!\s+dark:text-)/g, 'text-rose-900 dark:text-rose-100');
    content = content.replace(/text-rose-800(?!\s+dark:text-)/g, 'text-rose-800 dark:text-rose-200');
    content = content.replace(/text-rose-700(?!\s+dark:text-)/g, 'text-rose-700 dark:text-rose-300');

    content = content.replace(/text-emerald-900(?!\s+dark:text-)/g, 'text-emerald-900 dark:text-emerald-100');
    content = content.replace(/text-emerald-800(?!\s+dark:text-)/g, 'text-emerald-800 dark:text-emerald-200');
    content = content.replace(/text-emerald-700(?!\s+dark:text-)/g, 'text-emerald-700 dark:text-emerald-300');

    content = content.replace(/text-amber-900(?!\s+dark:text-)/g, 'text-amber-900 dark:text-amber-100');
    content = content.replace(/text-amber-800(?!\s+dark:text-)/g, 'text-amber-800 dark:text-amber-200');
    content = content.replace(/text-amber-700(?!\s+dark:text-)/g, 'text-amber-700 dark:text-amber-300');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf-8');
        modifiedCount++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Modified ${modifiedCount} files.`);
