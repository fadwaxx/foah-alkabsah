const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    customerId: String,
    customerName: String,
  phone: String,
  location: String,
  notes: String,

  items: Array,

  total: Number,

  status: {
    type: String,
    default: "pending"
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Order", orderSchema);