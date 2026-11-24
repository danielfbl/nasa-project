const express = require('express')
const path = require('path')

const morgan = require('morgan')
const cors = require('cors')

const api = require('./routes/api')

const app = express()

app.use(cors({origin: 'http://localhost:3000'})) //cors whitelisting our local react app
app.use(morgan('combined'))

app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'public'))) //serving our react build from our server /public folder

// versioning our api
app.use('/v1', api)

app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

module.exports = app
