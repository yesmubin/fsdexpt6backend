const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/database");

// USER REGISTRATION
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Invalid email address"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    // Check if email already exists
    const existingUserResult = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    // Hash password asynchronously so it doesn't block the event loop
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user and return the generated id
    const insertResult = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id`,
      [name, email, hashedPassword]
    );

    const newUserId = insertResult.rows[0].id;

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUserId,
        name,
        email,
        role: "user"
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Registration failed"
    });
  }
};

// USER LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Fetch user by email
    const userResult = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Compare password asynchronously
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h"
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Login failed"
    });
  }
};