import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'public', 'market-data.json');
if (!fs.existsSync(dataPath)) {
    console.error("Market data not found at:", dataPath);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const targets = ["Cosmic Barrier", "Cosmic Finesse", "Cosmic", "Barrier", "Finesse"];

console.log("--- SCANNING FOR TARGETS ---");
for (const key of Object.keys(data)) {
    for (const target of targets) {
        if (key.toLowerCase().includes(target.toLowerCase())) {
            console.log(`Found Key: "${key}" | Vendor: ${data[key].vendor_price} | Market: ${data[key].avg_3}`);
        }
    }
}
