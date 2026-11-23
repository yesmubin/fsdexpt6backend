
const express = require("express");
const router = express.Router();

// Import authentication middleware
const authenticateToken = require("../middleware/authMiddleware");

// Import role-based authorization middleware
const authorizeRole = require("../middleware/roleMiddleware");

// Import course controller
const courseController = require("../controllers/courseController");

// GET: View all courses (Admin and User)
router.get(
  "/",
  authenticateToken,
  authorizeRole("admin", "user"),
  courseController.getCourses
);

// GET: View a single course (Admin and User)
router.get(
  "/:id",
  authenticateToken,
  authorizeRole("admin", "user"),
  courseController.getCourseById
);

// POST: Add a new course (Admin only)
router.post(
  "/",
  authenticateToken,
  authorizeRole("admin"),
  courseController.createCourse
);

// PUT: Update an existing course (Admin only)
router.put(
  "/:id",
  authenticateToken,
  authorizeRole("admin"),
  courseController.updateCourse
);

// DELETE: Delete a course (Admin only)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("admin"),
  courseController.deleteCourse
);

module.exports = router;
