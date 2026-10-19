import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres.ozqllpgsshutwteyjfqw:cCeoYGgy474iOLFE@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

async function runMigrations() {
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to Supabase Postgres...');
  await client.connect();
  console.log('Connected successfully.');

  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files.`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running migration: ${file}...`);
    try {
      await client.query(sql);
      console.log(`✓ ${file} applied successfully.`);
    } catch (err) {
      console.error(`✗ Error in ${file}:`, err.message);
      // Log more context if available
      if (err.detail) console.error('Detail:', err.detail);
      throw err;
    }
  }

  await client.end();
  console.log('All migrations applied successfully!');
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
