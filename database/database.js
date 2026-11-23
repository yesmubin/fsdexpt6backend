const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

// Configure PostgreSQL connection using environment variables or defaults
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Alternatively, if not using DATABASE_URL, uncomment below:
  // host: process.env.DB_HOST || "localhost",
  // port: process.env.DB_PORT || 5432,
  // user: process.env.DB_USER || "postgres",
  // password: process.env.DB_PASSWORD || "postgres",
  // database: process.env.DB_NAME || "course_management",
});

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    // 1. Create courses table if it does not already exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        duration INTEGER NOT NULL
      );
    `);

    // 2. Create users table if it does not already exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
          CHECK(role IN ('admin', 'user')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create default accounts only when their email does not exist
    const defaultUsers = [
      {
        name: "Administrator",
        email: "admin@college.com",
        password: "pass@123",
        role: "admin",
      },
      {
        name: "Student",
        email: "student@college.com",
        password: "pass@123",
        role: "user",
      },
    ];

    for (const user of defaultUsers) {
      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [user.email]
      );

      if (existingUser.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        await client.query(
          `INSERT INTO users (name, email, password, role)
           VALUES ($1, $2, $3, $4)`,
          [user.name, user.email, hashedPassword, user.role]
        );
      }
    }

    // 4. Insert default courses inside a transaction
    const defaultCourses = [
      { title: "Data Structures", duration: 40 },
      { title: "Database Management Systems", duration: 45 },
      { title: "Web Development", duration: 50 },
      { title: "Operating Systems", duration: 40 },
      { title: "Natural Language Processing", duration: 45 },
    ];

    await client.query("BEGIN");
    try {
      for (const course of defaultCourses) {
        const existingCourse = await client.query(
          "SELECT id FROM courses WHERE title = $1",
          [course.title]
        );

        if (existingCourse.rows.length === 0) {
          await client.query(
            `INSERT INTO courses (title, duration)
             VALUES ($1, $2)`,
            [course.title, course.duration]
          );
        }
      }
      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    }

    console.log("PostgreSQL database connected successfully");
    console.log("Default accounts and courses checked/created.");
  } catch (err) {
    console.error("Error initializing PostgreSQL database:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Run initialization on startup
initializeDatabase();

// Export pool so other files can run: await db.query("SELECT ...", [params])
module.exports = pool;