const functions = require("firebase-functions")
const app = require("express")()
const cors = require("cors")
app.use(cors())

const { signup, login, getUserDetails } = require("./handle/users")
const {
  getContacts,
  addContact,
  deleteContact,
  updateContactDetails,
  getOneContact,
} = require("./handle/contacts")

const {
  addProduct,
  getProducts,
  deleteProduct,
  updateProductDetails,
  getOneProduct,
} = require("./handle/products")
const { FBAuth } = require("./util/FBAuth")

const {
  getTransactions,
  getOneTransaction,
  addTransaction,
  updateTransaction,
} = require("./handle/transactions")
//User routes
app.post("/signup", signup)
app.post("/login", login)
app.get("/user", FBAuth, getUserDetails)

//Contact routes
app.get("/contacts", FBAuth, getContacts)
app.get("/contacts/:contactId", FBAuth, getOneContact)
app.post("/contacts", FBAuth, addContact)
app.delete("/contacts/:contactId", FBAuth, deleteContact)
app.put("/contacts/:contactId", FBAuth, updateContactDetails)

//Product routes
app.post("/products", FBAuth, addProduct)
app.get("/products", FBAuth, getProducts)
app.get("/products/:productId", FBAuth, getOneProduct)
app.delete("/products/:productId", FBAuth, deleteProduct)
app.put("/products/:productId", FBAuth, updateProductDetails)

//Transaction routes
app.get("/transactions", FBAuth, getTransactions)
app.get("/transactions/:transactionId", FBAuth, getOneTransaction)
app.post("/transactions", FBAuth, addTransaction)
app.put("/transactions/:transactionId", FBAuth, updateTransaction)

exports.api = functions.region("us-central1").https.onRequest(app)
