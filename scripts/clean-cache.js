const { rmSync, existsSync } = require('fs');
const path = '.next';
if (existsSync(path)) {
  rmSync(path, { recursive: true, force: true });
}
