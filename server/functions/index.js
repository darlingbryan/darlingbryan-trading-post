const functions = require("firebase-functions")
const app = require("express")()
const cors = require("cors")
app.use(cors())

const { signup, login } = require("./handle/users")
const {
  getContacts,
  addContact,
  deleteContact,
  updateContactDetails,
} = require("./handle/contacts")

const {
  addProduct,
  getProducts,
  deleteProduct,
  updateProductDetails,
} = require("./handle/products")
const { FBAuth } = require("./util/FBAuth")

//User routes
app.post("/signup", signup)
app.post("/login", login)

//Contact routes
app.get("/contacts", FBAuth, getContacts)
app.post("/contacts", FBAuth, addContact)
app.delete("/contacts/:contactId", FBAuth, deleteContact)
app.put("/contacts/:contactId", FBAuth, updateContactDetails)

//Product routes
app.post("/products", FBAuth, addProduct)
app.get("/products", FBAuth, getProducts)
app.delete("/products/:productId", FBAuth, deleteProduct)
app.put("/products/:productId", FBAuth, updateProductDetails)

exports.api = functions.region("us-central1").https.onRequest(app)

//TODO CRUD User Contact/Product
