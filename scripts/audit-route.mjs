import fs from "node:fs";
import path from "node:path";

const routeArg = process.argv[2]?.replace(/^\/+|\/+$/g, "");
if (!routeArg) {
  console.error("Usage: node scripts/audit-route.mjs <route-path> (e.g. pets/compare or housing)");
  process.exit(1);
}

const rootDir = process.cwd();
const routeDir = path.join(rootDir, "src", "app", ...routeArg.split("/"));
if (!fs.existsSync(routeDir)) {
  console.error(`Route directory not found: ${routeDir}`);
  process.exit(1);
}

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const files = walk(routeDir);
const tsxFiles = files.filter((f) => f.endsWith(".tsx"));
const tsFiles = files.filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
const cssModules = files.filter((f) => f.endsWith(".module.css"));

const metrics = {
  route: `/${routeArg}`,
  totalFiles: files.length,
  tsxCount: tsxFiles.length,
  cssModuleCount: cssModules.length,
  styleJsxFiles: [],
  stateBlockUsers: [],
  directLucideUsers: [],
  bespokeUiFiles: [],
  godNodeCouplings: {
    useProfiles: [],
    useData: [],
    usePreferences: [],
    ItemModal: [],
  },
  largeFilesOver250Lines: [],
};

for (const file of tsFiles) {
  const rel = path.relative(rootDir, file).replace(/\\/g, "/");
  const content = fs.readFileSync(file, "utf8");
  const lineCount = content.split(/\r?\n/).length;
  if (lineCount > 250) {
    metrics.largeFilesOver250Lines.push({ file: rel, lines: lineCount });
  }
  if (/<style\s+jsx/.test(content)) {
    metrics.styleJsxFiles.push(rel);
  }
  if (/StateBlock/.test(content)) {
    metrics.stateBlockUsers.push(rel);
  }
  if (/from\s+["']lucide-react["']/.test(content)) {
    metrics.directLucideUsers.push(rel);
  }
  if (/NumberField|OptionMenu|CustomSelect|PetPicker|OwnedPetImage|PetImage/.test(path.basename(file))) {
    metrics.bespokeUiFiles.push(rel);
  }
  if (/useProfiles\b/.test(content)) metrics.godNodeCouplings.useProfiles.push(rel);
  if (/useData\b/.test(content)) metrics.godNodeCouplings.useData.push(rel);
  if (/usePreferences\b/.test(content)) metrics.godNodeCouplings.usePreferences.push(rel);
  if (/ItemModal|openItem/.test(content)) metrics.godNodeCouplings.ItemModal.push(rel);
}

// Check globals.css mentions for the leaf segment name
const leafSegment = routeArg.split("/").pop();
const globalsPath = path.join(rootDir, "src", "app", "globals.css");
let globalsClassMatches = [];
if (fs.existsSync(globalsPath) && leafSegment) {
  const globalsLines = fs.readFileSync(globalsPath, "utf8").split(/\r?\n/);
  const pattern = new RegExp(`^\\.[a-z0-9_-]*${leafSegment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[a-z0-9_-]*`, "i");
  for (let i = 0; i < globalsLines.length; i++) {
    if (pattern.test(globalsLines[i])) {
      globalsClassMatches.push(`L${i + 1}: ${globalsLines[i].trim()}`);
    }
  }
}

// Check existing tests
const testFiles = [
  ...walk(path.join(rootDir, "tests", "unit")),
  ...walk(path.join(rootDir, "tests", "a11y")),
]
  .map((f) => path.relative(rootDir, f).replace(/\\/g, "/"))
  .filter((rel) => rel.toLowerCase().includes(leafSegment.toLowerCase()));

console.log(
  JSON.stringify(
    {
      ...metrics,
      globalsClassMatches: globalsClassMatches.slice(0, 25),
      globalsClassMatchCount: globalsClassMatches.length,
      matchingTests: testFiles,
    },
    null,
    2,
  ),
);
