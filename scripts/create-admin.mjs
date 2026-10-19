import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envVars = {};
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      envVars[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log(`
Usage:
  node scripts/create-admin.mjs <email> <password>

Example:
  node scripts/create-admin.mjs author@example.com "MyStrongPassword123!"
`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log(`\nSetting up admin account for: ${email}...`);

  // 1. Check if user already exists in auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  let user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (user) {
    console.log(`✓ User already exists in auth.users (ID: ${user.id}).`);
    // Update password to ensure it matches
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
      email_confirm: true,
    });
    if (updateError) {
      console.warn(`Note: Could not update password: ${updateError.message}`);
    } else {
      console.log(`✓ Password and email confirmation verified.`);
    }
  } else {
    // Create new user with confirmed email
    const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      throw new Error(`Failed to create user in auth: ${createError.message}`);
    }

    user = newUserData.user;
    console.log(`✓ Created new user in auth.users (ID: ${user.id}).`);
  }

  // 2. Insert into site_admins table
  const { data: existingAdmin, error: adminCheckError } = await supabase
    .from('site_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminCheckError) {
    throw new Error(`Failed to check site_admins table: ${adminCheckError.message}`);
  }

  if (existingAdmin) {
    console.log(`✓ User is already registered in site_admins.`);
  } else {
    const { error: insertError } = await supabase
      .from('site_admins')
      .insert({ user_id: user.id });

    if (insertError) {
      throw new Error(`Failed to grant admin privileges in site_admins: ${insertError.message}`);
    }
    console.log(`✓ Granted admin privileges in site_admins table.`);
  }

  console.log(`\n🎉 Admin account successfully configured!`);
  console.log(`You can now log in at: http://localhost:3000/admin/login`);
  console.log(`Email: ${email}\n`);
}

main().catch((err) => {
  console.error('\n✗ Error creating admin account:', err.message);
  process.exit(1);
});
