const { db, admin } = require("../util/admin")

//Get user's products
exports.getProducts = async (req, res) => {
  try {
    //Get product ids from user's contact array
    const userSnaphot = await db.doc(`users/${req.user.handle}`).get()
    const productIds = userSnaphot.data().products
    const promises = []

    //Fetch products from products collection
    productIds.forEach((productId) => {
      const p = db.doc(`products/${productId}`).get()
      promises.push(p)
    })
    const productsSnapshots = await Promise.all(promises)

    //Shape data
    const products = []
    productsSnapshots.forEach((snap) => {
      const data = snap.data()
      data.id = snap.id
      products.push(data)
    })
    return res.status(200).json(products)
  } catch (err) {
    return res.status(500).json({ error: err.code })
  }
}

exports.addProduct = async (req, res) => {
  newProductDetails = {
    name: req.body.name,
    description: req.body.description,
    owner: req.user.handle,
  }

  if (newProductDetails.name.trim() === "")
    return res.status(400).json({ errors: "Product name must not be empty." })

  try {
    //Add product to products collection
    const newProduct = await db.collection("products").add(newProductDetails)
    const newProductId = newProduct.id

    //Add contact to user's products array
    await db.doc(`users/${req.user.handle}`).update({
      products: admin.firestore.FieldValue.arrayUnion(newProductId),
    })

    const responseData = newProductDetails
    responseData.id = newProduct.id
    return res.status(201).json(responseData)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

//Delete a product
exports.deleteProduct = async (req, res) => {
  const productId = req.params.productId
  const owner = req.user.handle

  try {
    //check if user owns product
    const userOwnProduct = await db
      .collection("products")
      .where(admin.firestore.FieldPath.documentId(), "==", productId)
      .where("owner", "==", owner)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          return false
        } else {
          return true
        }
      })

    if (userOwnProduct)
      return res.json({ error: "You do not own this product." })
    //delete product in products collection
    await db.doc(`products/${productId}`).delete()

    //delete product in user's contacts array
    await db
      .doc(`users/${owner}`)
      .update("products", admin.firestore.FieldValue.arrayRemove(productId))
    return res.json({ message: "Product successfully deleted." })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

//Update a product
