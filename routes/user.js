const express = require('express')
const userController = require('../controllers/user')
const userAuth = require('../middleware/auth')
const multer = require('multer')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); 
  }
});

const upload = multer({ storage: storage });

const router = express.Router()

router.post('/user/signup', userController.userSignup)
router.get('/user/login', userController.userLogin)
router.post('/forgot/password', userController.userForgotPassword)
router.put('/user/profile/:id', upload.single('file'), userController.userProfile)
router.post('/enroll/course/:userId/:courseId', userController.enrolledCourses)
router.get('/view/enrolled/course/:id', userController.viewEnrolledCourses)


module.exports = router
