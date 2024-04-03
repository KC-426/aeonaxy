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
    const findCourse = await db.any("SELECT * FROM course");

    if (findCourse.length === 0) {
      return res
        .status(404)
        .json({ message: "No courses found in the database" });
    }

    res
      .status(200)
      .json({
        message: "Courses fetched from the database",
        courses: findCourse,
      });
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateCourse = async (req, res) => {
    const {id} = req.params; 
    try {
      const { coursename, price, aboutcourse, category, level, popularity } = req.body;
  
      if (!id) {
        return res.status(400).json({ message: "Course ID is required" });
      }
  
      const existingCourse = await db.oneOrNone("SELECT * FROM course WHERE id = $1", [id]);
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
  }

const deleteCourseById = async (req, res) => {
    const { id } = req.params;
    try {
        const findCourse = await db.oneOrNone("SELECT * FROM course WHERE id = $1", id);
        if (!findCourse) {
            return res.status(404).json({ message: "Course not found in the database" });
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
exports.updateCourse = updateCourse
exports.deleteCourseById = deleteCourseById
exports.deleteCourses = deleteCourses
