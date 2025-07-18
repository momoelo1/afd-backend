const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    desc: { type: String, required: true },
    img: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    category: { type: Array },
    size: { type: Array },
    color: { type: Array },
    price: { type: Number },
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Product", ProductSchema);
