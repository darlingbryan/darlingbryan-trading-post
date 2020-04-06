const isEmail = (email) => {
  const regEx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  if (email.match(regEx)) return true
  else return false
}

const isEmpty = (string) => {
  if (string.trim() === "") return true
  else return false
}

exports.validateSignupData = (data) => {
  let errors = {}

  if (isEmpty(data.email)) {
    errors.email = "Must not be empty"
  } else if (!isEmail(data.email)) {
    errors.email = "Must be a valid email address"
  }

  if (isEmpty(data.password)) errors.password = "Must not be empty"
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Passwords must match"
  if (isEmpty(data.handle)) errors.handle = "Must not be empty"

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  }
}

exports.validateLoginData = (data) => {
  let errors = {}

  if (isEmpty(data.email)) errors.email = "Must not be empty"
  if (isEmpty(data.password)) errors.password = "Must not be empty"

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  }
}

exports.reduceContactDetails = (data) => {
  let errors = {}
  let newContactDetails = {}
  if (isEmpty(data.name.trim())) {
    errors.name = "Must not be empty"
  } else {
    newContactDetails.name = data.name
  }
  if (!isEmpty(data.email.trim())) {
    if (!isEmail(data.email.trim())) {
      errors.email = "Must be a valid email"
    } else {
      newContactDetails.email = data.email
    }
  }
  newContactDetails.city = data.city
  newContactDetails.address = data.address
  newContactDetails.phone = data.phone

  return { errors, newContactDetails }
}
