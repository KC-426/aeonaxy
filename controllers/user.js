const userSchema = require("../model/user");
const bcrypt = require("bcryptjs");
const pgp = require("pg-promise")();
const db = require("../database/db");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const fetch = require("node-fetch");
const cloudinary = require("cloudinary").v2;

if (!global.fetch) {
  global.fetch = fetch;

  if (!global.Headers) {
    const { Headers } = fetch;
    global.Headers = Headers;
  }
}

const resend = new Resend(process.env.API_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const userSchemaColumns = ["name", "email", "password"];

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
      return res.status(400).json({ message: "User already exists" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const hashedPwd = await bcrypt.hash(password, 12);

    const userData = {
      name,
      email,
      password: hashedPwd,
    };

    const filteredColumns = userSchemaColumns.filter((col) =>
      userData.hasOwnProperty(col)
    );
    const filteredUserSchema = new pgp.helpers.ColumnSet(filteredColumns, {
      table: "users",
    });

    const query =
      pgp.helpers.insert(userData, filteredUserSchema) + "RETURNING *";

    const result = await db.one(query);

    const mail = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "kuldeepchahar426@gmail.com",
      subject: "Hello World",
      html: "<p>hello kuldeep, you have successfully signed up! </p>",
    });

    console.log(mail);

    res
      .status(201)
      .json({ message: "User created successfully!", result, mail });
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

    cloudinary.uploader.upload(
      image_url,
      { public_id: `user_${id}` },
      function (error, result) {
        if (error) {
          console.error(error);
        } else {
          console.log("167 line", result);
        }
      }
    );

    res
      .status(200)
      .json({ message: "User profile updated", user: updatedUser });
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

    const mail = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "kuldeepchahar426@gmail.com",
      subject: "Enroll in course",
      html: "<p>hello, you have successfully enrolled in the course! </p>",
    });

    console.log(mail);

    res
      .status(200)
      .json({
        message: "User enrolled in the course successfully",
        user,
        mail,
      });
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
exports.enrolledCourses = enrolledCourses;
exports.viewEnrolledCourses = viewEnrolledCourses;
