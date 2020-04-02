const admin = require("firebase-admin")
const firebase = require("firebase")
const config = require("./config")

admin.initializeApp()
firebase.initializeApp(config)

const db = admin.firestore()

module.exports = { admin, db, firebase }
