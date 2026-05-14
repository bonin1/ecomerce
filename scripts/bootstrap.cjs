/**
 * First-time local setup: create backend/.env and frontend/.env.local from examples
 * if they are missing. Does not overwrite existing files.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function copyIfMissing(relExample, relTarget, label) {
  const src = path.join(root, relExample);
  const dest = path.join(root, relTarget);
  if (!fs.existsSync(src)) {
    console.error(`Missing template: ${relExample}`);
    process.exit(1);
  }
  if (fs.existsSync(dest)) {
    console.log(`[skip] ${label} already exists: ${relTarget}`);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`[ok]   Created ${label}: ${relTarget}`);
}

console.log('StrikeTech e-commerce — environment bootstrap\n');

copyIfMissing('backend/.env.example', 'backend/.env', 'backend env');
copyIfMissing('frontend/.env.example', 'frontend/.env.local', 'frontend env');

console.log(`
Next steps (required before npm run dev):

  1. Edit backend/.env
     - Set DB_NAME, DB_USER, DB_PASSWORD, DB_HOST for your MySQL instance.
     - Replace JWT_SECRET and ADMIN_JWT_SECRET with long random strings.
     - Optional: use Docker MySQL from the repo root:
         docker compose up -d
       Then set:
         DB_HOST=127.0.0.1
         DB_NAME=ecomerce
         DB_USER=ecomerce
         DB_PASSWORD=ecomerce_local

  2. Confirm frontend/.env.local has NEXT_PUBLIC_API_URL (default http://localhost:8080).

  3. Install dependencies (if you have not yet):
         npm run install:all

  4. Start both servers:
         npm run dev

  Storefront: http://localhost:3000   API: http://localhost:8080
`);
