const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    productId: { type: String, required: true },
    name: { type: String, required: true },
    desc: { type: String, required: true },
    img: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    price: { type: Number },
    category: { type: String }
  },
  { timestamps: true }
);

CartSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Cart", CartSchema);
