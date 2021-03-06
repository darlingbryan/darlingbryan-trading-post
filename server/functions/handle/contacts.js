const { db, admin } = require("../util/admin")
const { reduceContactDetails, checkOwnership } = require("../util/validators")

//Get the user's contacts
exports.getContacts = async (req, res) => {
  try {
    //Get contact ids from user's contact array
    const userSnaphot = await db.doc(`users/${req.user.handle}`).get()
    const contactIds = userSnaphot.data().contacts
    const promises = []

    //Fetch contact details from contacts collection
    contactIds.forEach((contactId) => {
      const p = db.doc(`contacts/${contactId}`).get()
      promises.push(p)
    })
    const contactsSnapshots = await Promise.all(promises)

    //Shape data
    const contacts = []
    contactsSnapshots.forEach((snap) => {
      const data = snap.data()
      data.id = snap.id
      contacts.push(data)
    })

    return res.status(200).json(contacts)
  } catch (err) {
    return res.status(500).json({ error: err.code })
  }
}

//Create a new Contact
exports.addContact = async (req, res) => {
  //Reduce data
  const { newContactDetails, errors } = reduceContactDetails(req.body)

  if (!Object.entries(errors).length === 0) return res.status(400).json(errors)

  newContactDetails.owner = req.user.handle

  try {
    //Check if contact already exist
    const contactSnapshot = await db
      .collection("contacts")
      .where("name", "==", req.body.name)
      .where("owner", "==", req.user.handle)
      .get()

    if (!contactSnapshot.empty)
      return res.status(404).json({ error: "Owner has contact already." })
    //Add contact to contacts collection
    const newContact = await db.collection("contacts").add(newContactDetails)
    //Add contact to user's contacts array
    const newContactId = newContact.id
    await db.doc(`users/${req.user.handle}`).update({
      contacts: admin.firestore.FieldValue.arrayUnion(newContactId),
    })
    const responseData = newContactDetails
    responseData.contactId = newContact.id
    res.status(200).json(responseData)
    return responseData
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

// Delete a contact
exports.deleteContact = async (req, res) => {
  const contactId = req.params.contactId
  const owner = req.user.handle
  const { data, userOwnsData, error } = await checkOwnership(
    contactId,
    owner,
    "contacts"
  )

  if (error) return res.status(500).json({ error: error })

  if (!userOwnsData) return res.json({ error: "Contact not found." })

  console.log(contactId)

  try {
    //check if user owns contact
    await db
      .collection("contacts")
      .where(admin.firestore.FieldPath.documentId(), "==", contactId)
      .where("owner", "==", owner)
      .get()
      .then((snapshot) => {
        if (snapshot.empty)
          return res.json({ error: "You do not own this contact." })
        return true
      })

    //delete contact in contacts collection
    await db.doc(`contacts/${contactId}`).delete()

    //delete contact in user's contacts array
    await db
      .doc(`users/${owner}`)
      .update("contacts", admin.firestore.FieldValue.arrayRemove(contactId))
    return res.json({ message: "Contact successfully deleted." })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

//Update contact
exports.updateContactDetails = async (req, res) => {
  const { data, userOwnsData, error } = await checkOwnership(
    req.params.contactId,
    req.user.handle,
    "contacts"
  )

  if (error) return res.status(500).json({ error: error })

  if (!userOwnsData) return res.json({ error: "Contact not found." })
  try {
    //Check if contact name is already used
    const contactSnapshot = await db
      .collection("contacts")
      .where("name", "==", req.body.name)
      .where("owner", "==", req.user.handle)
      .get()

    if (contactSnapshot.size > 1)
      return res
        .status(404)
        .json({ error: "One of your contact has that name already." })

    //Validate data
    const { newContactDetails, errors } = reduceContactDetails(req.body)
    if (!Object.entries(errors).length === 0)
      return res.status(400).json(errors)

    const updatedDetails = await db
      .doc(`/contacts/${req.params.contactId}`)
      .update({
        name: newContactDetails.name,
        email: newContactDetails.email,
        city: newContactDetails.city,
        address: newContactDetails.address,
        phone: newContactDetails.phone,
      })
    updatedDetails.contactId = req.params.contactId

    return res.status(200).json({ message: "Contact updated." })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

//Get one contact
exports.getOneContact = async (req, res) => {
  //Check if user owns contact
  const { data, userOwnsData, error } = await checkOwnership(
    req.params.contactId,
    req.user.handle,
    "contacts"
  )

  if (error) return res.status(500).json({ error: error })

  if (!userOwnsData) return res.json({ error: "Contact not found." })

  return res.status(200).json(data)
}
