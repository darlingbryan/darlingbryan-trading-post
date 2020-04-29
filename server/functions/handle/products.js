const { db, admin } = require("../util/admin")
const { checkOwnership } = require("../util/validators")
//Get user's products
exports.getProducts = async (req, res) => {
  try {
    //Get product ids from user's products array
    const userSnaphot = await db.doc(`users/${req.user.handle}`).get()
    const productIds = userSnaphot.data().products

    //Fetch products from products collection
    const promises = []
    productIds.forEach((productId) => {
      const p = db.doc(`products/${productId}`).get()
      promises.push(p)
    })
    const productsSnapshots = await Promise.all(promises)

    //Shape data
    const products = []
    productsSnapshots.forEach((snap) => {
      const data = snap.data()
      console.log(snap.data())
      data.id = snap.id
      products.push(data)
    })
    return res.status(200).json(products)
  } catch (err) {
    return res.status(500).json({ error: err.code })
  }
}

//Add a product
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

    //Add product to user's products array
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
    const { data, userOwnsData, error } = await checkOwnership(
      req.params.productId,
      req.user.handle,
      "products"
    )

    if (error) return res.status(500).json({ error: error })

    if (!userOwnsData) return res.json({ error: "Product not found." })

    //delete product in products collection
    await db.doc(`products/${productId}`).delete()

    //delete product in user's products array
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
exports.updateProductDetails = async (req, res) => {
  if (req.body.name.trim() === "")
    return res.status(400).json({ errors: "Product name must not be empty." })

  const { data, userOwnsData, error } = await checkOwnership(
    req.params.productId,
    req.user.handle,
    "products"
  )

  if (error) return res.status(500).json({ error: error })

  if (!userOwnsData) return res.json({ error: "Product not found." })

  try {
    const productSnapshot = await db
      .collection("products")
      .where("name", "==", req.body.name)
      .where("owner", "==", req.user.handle)
      .get()

    if (productSnapshot.size > 1)
      return res
        .status(404)
        .json({ error: "One of your product has that name already." })

    await db.doc(`/products/${req.params.productId}`).update({
      name: req.body.name,
      description: req.body.description,
    })
    return res.status(200).json({ message: "Product updated." })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

//Get one product
exports.getOneProduct = async (req, res) => {
  //Check if user owns product
  const { data, userOwnsData, error } = await checkOwnership(
    req.params.productId,
    req.user.handle,
    "products"
  )

  if (error) return res.status(500).json({ error: error })

  if (!userOwnsData) return res.json({ error: "Product not found." })

  return res.status(200).json(data)
}
