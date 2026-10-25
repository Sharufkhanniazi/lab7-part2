const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Snapshot of products at purchase time, so later price changes don't alter old orders
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        image: String,
        price: Number,
        quantity: Number,
      },
    ],
    billing: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: String,
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: String,
    },
    paymentMethod: { type: String, enum: ['card', 'paypal', 'cod'], required: true },
    subtotal: Number,
    shipping: { type: Number, default: 0 },
    tax: Number,
    total: Number,
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
