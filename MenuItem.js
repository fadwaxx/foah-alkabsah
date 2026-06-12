const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  ar: String,
  en: String,
  price: Number,
  category: String,
  image: String,
  description: String,

  calories: {
    type: Number,
    default: 0
  },

  options: [
    {
      title: String,

      type: {
        type: String,
        enum: ["single", "multiple"],
        default: "single"
      },

      maxChoices: {
        type: Number,
        default: 1
      },

      choices: [
        {
          name: String,
          extraPrice: {
            type: Number,
            default: 0
          }
        }
      ]
    }
  ],

  isNew: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("MenuItem", menuItemSchema);