const fs = require('fs');
const path = require('path');

const colorPath = path.join(__dirname, 'color-tokens.json');
const typographyPath = path.join(__dirname, 'design-tokens.tokens.json');
const outputPath = path.join(__dirname, 'tokens.css');

const lines = [':root {'];

function toKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function formatValue(val) {
  if (typeof val === 'string' && val.includes(' ')) {
    return `'${val}'`;
  }
  return val;
}

// ─── Color tokens ───────────────────────────────────────────────
try {
  const raw = fs.readFileSync(colorPath, 'utf8').trim();
  if (raw) {
    const data = JSON.parse(raw);
    const source = data.color || data;
    const roles = source.roles || source;

    for (const [key, val] of Object.entries(roles)) {
      if (val && typeof val === 'object' && val.value !== undefined) {
        lines.push(`  --color-${key}: ${val.value};`);
      } else if (typeof val === 'string') {
        lines.push(`  --color-${key}: ${val};`);
      }
    }
  }
} catch (err) {
  console.error('Skipping color tokens:', err.message);
}

// ─── Typography tokens ──────────────────────────────────────────
try {
  const raw = fs.readFileSync(typographyPath, 'utf8');
  const data = JSON.parse(raw);

  // Section "typography" — each property has { type, value }
  if (data.typography) {
    for (const [name, props] of Object.entries(data.typography)) {
      const prefix = `--font-${name.replace(/\s+/g, '-')}`;
      for (const [prop, spec] of Object.entries(props)) {
        const propName = toKebab(prop);
        let cssVal = spec.value;
        if (spec.type === 'dimension' && typeof cssVal === 'number') {
          cssVal = `${cssVal}px`;
        }
        lines.push(`  ${prefix}-${propName}: ${formatValue(cssVal)};`);
      }
    }
  }
} catch (err) {
  console.error('Error processing typography tokens:', err.message);
}

lines.push('}');
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
console.log(`✓ Tokens written to ${outputPath}`);
