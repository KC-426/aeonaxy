const express = require('express')
const courseController = require('../controllers/course')
const adminAuth = require('../middleware/auth')

const router = express.Router()

router.post('/add/course', adminAuth, courseController.createCourse)
router.get('/get/course', adminAuth, courseController.fetchCourse)
router.put('/update/course/:id', adminAuth, courseController.updateCourse)
router.delete('/delete/course/:id', adminAuth, courseController.deleteCourseById)
router.delete('/delete/course', adminAuth, courseController.deleteCourses)


module.exports = router
