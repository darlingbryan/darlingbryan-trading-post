const { admin, db } = require("./admin")

exports.FBAuth = async (req, res, next) => {
  let idToken
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1]
  } else {
    console.error("No token found")
    return res.status(403).json({ error: "Unauthorized" })
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    req.user = decodedToken
    const dataSnapshot = await db
      .collection("users")
      .where("userId", "==", req.user.uid)
      .limit(1)
      .get()
    req.user.handle = dataSnapshot.docs[0].data().handle
    return next()
  } catch (err) {
    console.error("Error while verifying token ", err)
    return res.status(403).json(err)
  }
}
