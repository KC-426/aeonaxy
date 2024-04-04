const userSchema = require("../model/user");
const bcrypt = require("bcryptjs");
const pgp = require("pg-promise")();
const db = require("../database/db");
const jwt = require("jsonwebtoken");
const courseSchema = require("../model/course");

const userSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill all the required fields!" });
    }

    const existingUser = await db.oneOrNone(
      "SELECT * FROM users WHERE email = $1",
      email
    );
    if (existingUser) {
      return res.status(400).json({ message: "User already exist" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const hashedPwd = await bcrypt.hash(password, 12);

    const query =
      pgp.helpers.insert({ name, email, password: hashedPwd }, userSchema) +
      "RETURNING *";

    const result = await db.one(query);

    res.status(201).json({ message: "User created successfully!", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const findUser = await db.oneOrNone(
      "SELECT * FROM users WHERE email = $1",
      email
    );

    if (!findUser) {
      return res
        .status(404)
        .json({ message: "User not found. Please sign up!" });
    }

    const isMatchPassword = await bcrypt.compare(password, findUser.password);
    if (!isMatchPassword) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = jwt.sign({ email }, "kuldeep_secret_key", {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res
      .status(200)
      .json({ message: "User logged in successfully", email, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const userProfile = async (req, res, next) => {
  console.log("data");
  const { id } = req.params;
  try {
    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);

    const { phone_no, gender } = req.body;
    const { originalname: image_name, path: image_url } = req.file;

    const updateUserQuery = `
      UPDATE users
      SET phone_no = $1, gender = $2, image_name = $3, image_url = $4
      WHERE id = $5
      RETURNING *;
    `;

    const updatedUser = await db.oneOrNone(updateUserQuery, [
      phone_no,
      gender,
      image_name,
      image_url,
      id,
    ]);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User profile updated", user: updatedUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProfile = async (req, res) => {
  try {
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const enrolledCourses = async (req, res) => {
  const { userId, courseId } = req.params;
  try {
    const user = await db.oneOrNone(
      "SELECT * FROM users WHERE id = $1",
      userId
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.enrolledCourses = user.enrolledCourses || [];

    const course = await db.oneOrNone(
      "SELECT * FROM course WHERE id = $1",
      courseId
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isEnrolled = user.enrolledCourses.some(
      (enrolledCourse) => enrolledCourse.id === course.id
    );
    if (isEnrolled) {
      return res
        .status(400)
        .json({ message: "User is already enrolled in the course" });
    }

    user.enrolledCourses.push({
      id: course.id,
      coursename: course.coursename,
      price: course.price,
      aboutcourse: course.aboutcourse,
      category: course.category,
      level: course.level,
      popularity: course.popularity,
    });

    await db.none("UPDATE users SET enrolledCourses = $1 WHERE id = $2", [
      user.enrolledCourses,
      userId,
    ]);

    res
      .status(200)
      .json({ message: "User enrolled in the course successfully", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const viewEnrolledCourses = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.oneOrNone("SELECT * from users WHERE id = $1", id);
    console.log(user);

    const enrolledCourses = user.enrolledcourses
      ? JSON.parse(user.enrolledcourses)
      : [];

    res
      .status(200)
      .json({ message: "Enrolled courses are fetched", enrolledCourses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.userSignup = userSignup;
exports.userLogin = userLogin;
exports.userProfile = userProfile;
exports.updateProfile = updateProfile;
exports.enrolledCourses = enrolledCourses;
exports.viewEnrolledCourses = viewEnrolledCourses;
