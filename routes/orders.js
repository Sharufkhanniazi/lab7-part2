const express = require('express');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly, asyncHandler } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const TAX_RATE = 0.1;      // checkout.html shows ~10% tax
const SHIPPING = 0;        // checkout.html shows "Free"
const round2 = (n) => Math.round(n * 100) / 100;

// POST /api/orders   (Place Order button in checkout.html)
// body: { billing: {firstName,lastName,email,phone,address,city,postalCode}, paymentMethod: "card"|"paypal"|"cod" }
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { billing = {}, paymentMethod } = req.body;

    const missing = ['firstName', 'lastName', 'email', 'address', 'city'].filter((f) => !billing[f]);
    if (missing.length) {
      return res.status(400).json({ message: `Missing billing fields: ${missing.join(', ')}` });
    }
    if (!['card', 'paypal', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'paymentMethod must be card, paypal or cod' });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    const cartItems = cart ? cart.items.filter((i) => i.product) : [];
    if (!cartItems.length) return res.status(400).json({ message: 'Cart is empty' });

    // Stock check
    for (const i of cartItems) {
      if (i.quantity > i.product.stock) {
        return res.status(400).json({ message: `Not enough stock for "${i.product.name}"` });
      }
    }

    const items = cartItems.map((i) => ({
      product: i.product._id,
      name: i.product.name,
      image: i.product.image,
      price: i.product.price,
      quantity: i.quantity,
    }));
    const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
    const tax = round2(subtotal * TAX_RATE);
    const total = round2(subtotal + SHIPPING + tax);

    const order = await Order.create({
      user: req.user._id,
      items,
      billing,
      paymentMethod,
      subtotal,
      shipping: SHIPPING,
      tax,
      total,
    });

    // Reduce stock, then empty the cart
    await Product.bulkWrite(
      items.map((i) => ({
        updateOne: { filter: { _id: i.product }, update: { $inc: { stock: -i.quantity } } },
      }))
    );
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  })
);

// GET /api/orders          (my orders)  — admins can add ?all=true to see everyone's
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = req.user.role === 'admin' && req.query.all === 'true' ? {} : { user: req.user._id };
    const orders = await Order.find(filter).sort('-createdAt');
    res.json({ count: orders.length, orders });
  })
);

// GET /api/orders/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed to view this order' });
    }
    res.json(order);
  })
);

// PATCH /api/orders/:id/status   (admin)   body: { status }
router.patch(
  '/:id/status',
  adminOnly,
  asyncHandler(async (req, res) => {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  })
);

module.exports = router;
