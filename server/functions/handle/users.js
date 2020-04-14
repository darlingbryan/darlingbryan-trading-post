const { db, firebase } = require("../util/admin")

const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails,
} = require("../util/validators")

//signup user
exports.signup = async (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  }

  const { valid, errors } = validateSignupData(newUser)

  if (!valid) return res.status(400).json(errors)

  let token, userId
  try {
    const handleSnapshot = await db.doc(`/users/${newUser.handle}`).get()
    if (handleSnapshot.exists) {
      return res.status(400).json({ handle: "this handle is already taken" })
    } else {
      const newUserDataSnapshot = await firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
      userId = newUserDataSnapshot.user.uid
      token = await newUserDataSnapshot.user.getIdToken()
      console.log(token)
    }
    const userCredentials = {
      handle: newUser.handle,
      email: newUser.email,
      createdAt: new Date().toISOString(),
      userId,
    }

    await db.doc(`/users/${newUser.handle}`).set(userCredentials)
    return await res.status(201).json({ token })
  } catch (err) {
    console.error(err)
    if (err.code === "auth/email-already-in-use") {
      return res.status(400).json({ email: "Email is already is use" })
    } else {
      return res
        .status(500)
        .json({ general: "Something went wrong, please try again" })
    }
  }
}

//Login User
exports.login = async (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  }

  const { valid, errors } = validateLoginData(user)

  if (!valid) return res.status(400).json(errors)

  try {
    const userData = await firebase
      .auth()
      .signInWithEmailAndPassword(user.email, user.password)
    const token = await userData.user.getIdToken()
    return res.status(201).json({ token })
  } catch (err) {
    console.error(err)
    return res
      .status(403)
      .json({ general: "Wrong credentials, please try again" })
  }
}

//Get user
exports.getUserDetails = async (req, res) => {
  let data = {}
  try {
    await db
      .doc(`/users/${req.user.handle}`)
      .get()
      .then((snapshot) => {
        data.handle = snapshot.data().handle
        data.email = snapshot.data().email
        return
      })

    return res.status(200).json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}
