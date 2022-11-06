const express = require('express')
const router = express.Router()
const {login, register, resetUserPassword, newUserPassword, changeKicks, kicksByMonth, kicksByDay, kicksByHour, validDaysOfMonth, updateDay} = require('../controllers/auth')
const authenticateUser = require('../middleware/authentication')


router.post('/register', register)
router.post('/login', login)
router.post('/forgot', resetUserPassword)
router.patch('/reset/:id', newUserPassword)
router.post('/changekicks', authenticateUser, changeKicks);
router.get('/kicks-month', authenticateUser, kicksByMonth);
router.get('/kicks-day', authenticateUser, kicksByDay);
router.get('/kicks-hour', authenticateUser, kicksByHour);
router.get('/valid-days', authenticateUser, validDaysOfMonth);
router.patch('/update-day', authenticateUser, updateDay)



module.exports = router