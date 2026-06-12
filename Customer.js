const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: String,
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true
  },
  
  passwordHash: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  } 
}, { timestamps: true });

module.exports = mongoose.model("Customer", customerSchema);