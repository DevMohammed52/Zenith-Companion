import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'public', 'items-map.json');
const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log("Keys sample:", Object.keys(items).slice(0, 20));
