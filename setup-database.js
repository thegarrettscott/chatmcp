const https = require('https');

const SUPABASE_URL = 'https://desyagvwhkpjnauadwpk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlc3lhZ3Z3aGtwam5hdWFkd3BrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDc1MzczMCwiZXhwIjoyMDYwMzI5NzMwfQ.TCFuFij0awIKqs7MJz1-Z257023rpUq3EtA-uAamHHY';

// Read the migration file
const fs = require('fs');
const migration = fs.readFileSync('supabase-migration.sql', 'utf8');

// Split migration into individual statements
const statements = migration
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

console.log(`Executing ${statements.length} SQL statements...`);

async function executeStatement(statement, index) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query: statement + ';'
    });

    const options = {
      hostname: 'desyagvwhkpjnauadwpk.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ Statement ${index + 1} executed successfully`);
          resolve(responseData);
        } else {
          console.log(`❌ Statement ${index + 1} failed:`, responseData);
          resolve(responseData); // Don't reject, continue with other statements
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Statement ${index + 1} error:`, error.message);
      resolve(error.message); // Don't reject, continue with other statements
    });

    req.write(data);
    req.end();
  });
}

async function runMigration() {
  console.log('🚀 Starting database migration...');
  
  for (let i = 0; i < statements.length; i++) {
    await executeStatement(statements[i], i);
    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ Migration completed!');
}

runMigration().catch(console.error); 