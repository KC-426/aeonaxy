const express = require('express')
const superAdminController = require('../controllers/superAdmin')

const router = express.Router()

router.post('/superadmin/signup', superAdminController.superAdminSignup)
router.get('/superadmin/login', superAdminController.superAdminLogin)


module.exports = router
