const { Client } = require("pg");

async function resetDb() {
  const connectionString =
    process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No database connection string found.");
    process.exit(1);
  }

  console.log("Connecting to database to reset...");
  // Vercel Postgres usually requires SSL.
  // We try with ssl: true, but allow unauthorized (self-signed) certificates which is common in some managed DBs.
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    console.log("Dropping all tables in public schema...");
    // Drop all tables including _prisma_migrations
    const dropQuery = `
      DO $$ DECLARE r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `;

    await client.query(dropQuery);
    console.log("All tables dropped successfully.");
  } catch (err) {
    console.error("Error resetting database:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDb();

