const functions = require("firebase-functions")
const app = require("express")()
const cors = require("cors")
app.use(cors())

const { db } = require("./util/admin")

const { signup, login } = require("./handle/users")

//User routes
app.post("/signup", signup)
app.post("/login", login)

//Get transactions
app.get("/transactions", (req, res) => {
  db.collection("transactions")
    .get()
    .then((data) => {
      let transactions = []
      data.forEach((doc) => {
        transactions.push({
          owner: doc.data().owner,
          client: doc.data().client,
          completed: doc.data().completed,
        })
      })
      return res.json(transactions)
    })
    .catch((err) => {
      console.log(err)
    })
})

exports.api = functions.region("us-central1").https.onRequest(app)
