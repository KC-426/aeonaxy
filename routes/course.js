const express = require('express')
const courseController = require('../controllers/course')
const userAuth = require('../middleware/auth')

const router = express.Router()

router.post('/add/course', courseController.createCourse)
router.get('/get/course', courseController.fetchCourse)
router.put('/update/course/:id', courseController.updateCourse)
router.delete('/delete/course/:id', courseController.deleteCourseById)
router.delete('/delete/course', courseController.deleteCourses)


module.exports = router
