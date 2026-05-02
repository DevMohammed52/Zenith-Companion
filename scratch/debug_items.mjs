import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'public', 'items-map.json');
const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const targets = ["Cosmic"];

console.log("--- SCANNING FOR TARGETS ---");
for (const [id, data] of Object.entries(items)) {
    if (data.name && data.name.toLowerCase().includes("cosmic")) {
        console.log(`Found Item: "${data.name}" | ID: ${id}`);
    }
}
