const { db, admin } = require("../util/admin")
const { checkOwnership } = require("../util/validators")

//Get user's transactions
exports.getTransactions = async (req, res) => {
  try {
    //Get transaction ids from user's transactions array
    const userSnaphot = await db.doc(`users/${req.user.handle}`).get()
    const transactionIds = userSnaphot.data().transactions

    //fetch transactions from transaction collection
    const promises = []
    transactionIds.forEach((transactionId) => {
      const p = db.doc(`transactions/${transactionId}`).get()
      promises.push(p)
    })
    const transactionsSnapshots = await Promise.all(promises)
    //Shape data
    const transactions = []
    transactionsSnapshots.forEach((snap) => {
      const data = snap.data()
      data.id = snap.id
      transactions.push(data)
    })
    return res.status(200).json(transactions)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

//Get a transaction
exports.getOneTransaction = async (req, res) => {
  transactionDetails = {}
  try {
    //check ownership and get data
    const { data, userOwnsData, error } = await checkOwnership(
      req.params.transactionId,
      req.user.handle,
      "transactions"
    )
    if (error) return res.status(500).json({ error: error })

    if (!userOwnsData) return res.json({ error: "Transaction not found." })

    transactionDetails = data

    //Get transactionItems
    await db
      .collection(`transactions/${req.params.transactionId}/transactionItems`)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          transactionDetails.transactionItem = doc.data()
        })
        return
      })

    //Get notes
    await db
      .collection(`transactions/${req.params.transactionId}/notes`)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          transactionDetails.notes = doc.data()
        })
        return
      })

    return res.status(200).json(transactionDetails)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

//Add a transaction
exports.addTransaction = async (req, res) => {
  const newTransactionDetails = {
    owner: req.user.handle,
    client: req.body.client,
    completed: req.body.completed,
    createdAt: new Date().toISOString(),
    notes: {},
    transactionItem: [],
  }

  try {
    //Add transaction to transactions collection
    const newTransaction = await db
      .collection("transactions")
      .add(newTransactionDetails)
    const newTransactionId = newTransaction.id

    //Add transaction to user's transactions array
    await db.doc(`users/${req.user.handle}`).update({
      transactions: admin.firestore.FieldValue.arrayUnion(newTransactionId),
    })

    //User will need to create the Transaction first before adding notes and transactionItems

    const responseData = newTransactionDetails
    responseData.id = newTransaction.id

    return res.status(201).json(responseData)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

exports.updateTransaction = async (req, res) => {
  const { data, userOwnsData, error } = await checkOwnership(
    req.params.transactionId,
    req.user.handle,
    "transactions"
  )

  if (error) return res.status(500).json({ error: error })

  if (!userOwnsData) return res.json({ error: "Transaction not found." })

  try {
    const transaction = await db
      .doc(`/transactions/${req.params.transactionId}`)
      .update({
        client: req.body.client,
        completed: req.body.completed,
        //NOTE On the front end, grab all notes and send with new notes
        notes: req.body.notes,
        transactionItems: req.body.transactionItems,
      })

    return res.status(200).json({ transaction })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}
