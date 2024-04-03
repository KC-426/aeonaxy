const db = require("../database/db");
const courseSchema = require("../model/course");
const pgp = require("pg-promise")();

const createCourse = async (req, res) => {
  try {
    const { coursename, price, aboutcourse, category, level, popularity } =
      req.body;

    const findCourse = await db.oneOrNone(
      "SELECT * FROM course WHERE coursename = $1",
      [coursename]
    );
    if (findCourse) {
      return res
        .status(400)
        .json({ message: "Course already added in the database" });
    }

    const query =
      pgp.helpers.insert(
        {
          coursename,
          price,
          aboutcourse,
          category,
          level,
          popularity,
        },
        courseSchema
      ) + " RETURNING *";

    const result = await db.one(query);

    res.status(201).json({ message: "Course added to the database!", result });
  } catch (error) {
    console.error("Error adding course:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const fetchCourse = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM course
      LIMIT $1
      OFFSET $2
    `;

    const courses = await db.any(query, [limit, offset]);

    if (courses.length === 0) {
      return res.status(404).json({ message: "No courses found in the database" });
    }

    const totalCountQuery = "SELECT COUNT(*) FROM course";
    const totalCount = await db.one(totalCountQuery, [], (data) => +data.count);

    const totalPages = Math.ceil(totalCount / limit);

    const pagination = {
      currentPage: page,
      pageSize: limit,
      totalCount: totalCount,
      totalPages: totalPages,
    };

    if (page < totalPages) {
      pagination.nextPage = `/get/course?page=${page + 1}&limit=${limit}`;
    }

    if (page > 1) {
      pagination.prevPage = `/get/course?page=${page - 1}&limit=${limit}`;
    }


    res.status(200).json({
      message: "Courses fetched from the database",
      courses: courses,
      pagination: pagination,
    });
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const { coursename, price, aboutcourse, category, level, popularity } =
      req.body;

    if (!id) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const existingCourse = await db.oneOrNone(
      "SELECT * FROM course WHERE id = $1",
      [id]
    );
    if (!existingCourse) {
      return res.status(404).json({ message: "No Course found" });
    }

    await db.none(
      "UPDATE course SET coursename = $1, price = $2, aboutcourse = $3, category = $4, level = $5, popularity = $6 WHERE id = $7",
      [coursename, price, aboutcourse, category, level, popularity, id]
    );

    res.status(200).json({ message: "Course updated successfully" });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteCourseById = async (req, res) => {
  const { id } = req.params;
  try {
    const findCourse = await db.oneOrNone(
      "SELECT * FROM course WHERE id = $1",
      id
    );
    if (!findCourse) {
      return res
        .status(404)
        .json({ message: "Course not found in the database" });
    }

    await db.none("DELETE FROM course WHERE id = $1", id);

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteCourses = async (req, res) => {
  try {
    const findCourse = await db.any("SELECT * FROM course");
    if (!findCourse) {
      return res.status(404).json({ message: "No course in the database" });
    }

    await db.none("DELETE FROM course");

    res.status(200).json({ message: "All Courses deleted successfully" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.createCourse = createCourse;
exports.fetchCourse = fetchCourse;
exports.updateCourse = updateCourse;
exports.deleteCourseById = deleteCourseById;
exports.deleteCourses = deleteCourses;
