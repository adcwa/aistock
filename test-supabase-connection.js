const postgres = require('postgres');
require('dotenv').config({ path: '.env.vercel' });

async function testConnection() {
  console.log('Testing Supabase database connection...');
  console.log('POSTGRES_URL:', process.env.POSTGRES_URL);
  
  const sql = postgres(process.env.POSTGRES_URL);

  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ Database connection successful!');
    console.log('✅ Database query successful:', result[0]);
    
    await sql.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testConnection();
