const fs = require('fs');
const path = require('path');

const resourcesDir = path.join(__dirname, '..', 'src', 'assets', 'resources');
const manifestPath = path.join(resourcesDir, 'manifest.json');

function buildManifest() {
  try {
    if (!fs.existsSync(resourcesDir)) {
      console.error('Resources folder does not exist:', resourcesDir);
      process.exit(1);
    }

    // Recursively collect .txt files and keep paths relative to resourcesDir
    function walk(dir, base) {
      const result = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          result.push(...walk(full, path.join(base, ent.name)));
        } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.txt')) {
          // use forward slashes in manifest
          const rel = path.join(base, ent.name).split(path.sep).join('/');
          result.push(rel);
        }
      }
      return result;
    }

    const entries = walk(resourcesDir, '').filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    fs.writeFileSync(manifestPath, JSON.stringify(entries, null, 2) + '\n', 'utf8');
    console.log('Wrote manifest with', entries.length, 'entries to', manifestPath);
  } catch (err) {
    console.error('Failed to build manifest:', err);
    process.exit(2);
  }
}

if (require.main === module) {
  buildManifest();
}

module.exports = { buildManifest };
