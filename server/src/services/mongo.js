const mongoose = require('mongoose')
const os = require('node:os')

require('dotenv').config()

const MONGO_URL = process.env.MONGO_URL

mongoose.connection.once('open', () => {
    console.log('MongoDB connection ready')
})

mongoose.connection.on('error', (err) => {
    console.error(err)
})

async function mongoConnect() {
    await mongoose.connect(MONGO_URL, {
        runtimeAdapters: {os},
    })
}

async function mongoDisconnect() {
    await mongoose.disconnect()
}

module.exports = {mongoConnect, mongoDisconnect}
