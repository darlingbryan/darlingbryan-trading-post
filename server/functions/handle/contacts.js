const { db, admin } = require("../util/admin")

//Get the user's contacts
exports.getContacts = async (req, res) => {
  try {
    //Get contact ids from user's contact array
    const userSnaphot = await db.doc(`users/${req.user.handle}`).get()
    const contactIds = userSnaphot.data().contacts
    const promises = []

    //Fect contact details from contacts collection
    contactIds.forEach((contactid) => {
      const p = db.doc(`contacts/${contactid}`).get()
      promises.push(p)
    })
    const contactsSnapshots = await Promise.all(promises)

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
  const newContactDetails = {
    owner: req.user.handle,
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    city: req.body.city,
  }

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
    const newContactId = newContact.id
    //Add contact to user's contacts array
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
