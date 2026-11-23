const db = require("../database/database");

// Validate course ID.
function getValidId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Validate course data.
function validateCourse(body) {
  const { title, duration } = body || {};
  const errors = [];

  if (typeof title !== "string" || title.trim().length < 3) {
    errors.push("title must be a string with at least 3 characters");
  }

  if (!Number.isInteger(duration) || duration < 1 || duration > 100) {
    errors.push("duration must be an integer from 1 to 100");
  }

  return {
    errors,
    title: typeof title === "string" ? title.trim() : "",
    duration
  };
}

// GET all courses.
exports.getCourses = async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT id, title, duration FROM courses ORDER BY id ASC"
    );

    res.status(200).json({
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
};

// GET course by ID.
exports.getCourseById = async (req, res, next) => {
  const id = getValidId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "id must be a positive integer"
    });
  }

  try {
    const result = await db.query(
      "SELECT id, title, duration FROM courses WHERE id = $1",
      [id]
    );

    const course = result.rows[0];

    if (!course) {
      return res.status(404).json({
        error: "Course not found"
      });
    }

    res.status(200).json({
      data: course
    });
  } catch (err) {
    next(err);
  }
};

// CREATE course.
exports.createCourse = async (req, res, next) => {
  const { errors, title, duration } = validateCourse(req.body);

  if (errors.length) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO courses (title, duration)
       VALUES ($1, $2)
       RETURNING id, title, duration`,
      [title, duration]
    );

    res.status(201).json({
      message: "Course created",
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE course.
exports.updateCourse = async (req, res, next) => {
  const id = getValidId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "id must be a positive integer"
    });
  }

  const { errors, title, duration } = validateCourse(req.body);

  if (errors.length) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors
    });
  }

  try {
    const result = await db.query(
      `UPDATE courses
       SET title = $1, duration = $2
       WHERE id = $3
       RETURNING id, title, duration`,
      [title, duration, id]
    );

    const updatedCourse = result.rows[0];

    if (!updatedCourse) {
      return res.status(404).json({
        error: "Course not found"
      });
    }

    res.status(200).json({
      message: "Course updated",
      data: updatedCourse
    });
  } catch (err) {
    next(err);
  }
};

// DELETE course.
exports.deleteCourse = async (req, res, next) => {
  const id = getValidId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "id must be a positive integer"
    });
  }

  try {
    const result = await db.query(
      `DELETE FROM courses
       WHERE id = $1
       RETURNING id, title, duration`,
      [id]
    );

    const deletedCourse = result.rows[0];

    if (!deletedCourse) {
      return res.status(404).json({
        error: "Course not found"
      });
    }

    res.status(200).json({
      message: "Course deleted",
      data: deletedCourse
    });
  } catch (err) {
    next(err);
  }
};