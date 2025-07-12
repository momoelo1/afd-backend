const express = require('express')
const { signup } = require('../controllers/auth').default
const { sign } = require('jsonwebtoken')

const router = express.Router()

router.post('/api/signup', signup)