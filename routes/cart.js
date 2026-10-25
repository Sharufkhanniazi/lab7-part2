const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect, asyncHandler } = require('../middleware/auth');

const router = express.Router();
router.use(protect); // every cart route needs a logged-in user

const round2 = (n) => Math.round(n * 100) / 100;

// Load (or create) the user's cart and return it with totals
async function cartResponse(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) cart = await Cart.create({ user: userId, items: [] });

  // Ignore items whose product was deleted
  const items = cart.items.filter((i) => i.product);
  const subtotal = round2(items.reduce((sum, i) => sum + i.product.price * i.quantity, 0));
  return { items, subtotal };
}

// GET /api/cart
router.get(
  '/',
  asyncHandler(async (req, res) => res.json(await cartResponse(req.user._id)))
);

// POST /api/cart   body: { productId, quantity }
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;
    const qty = Number(quantity);
    if (!productId || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: 'productId and a positive integer quantity are required' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const existing = cart.items.find((i) => i.product.toString() === productId);
    const newQty = (existing ? existing.quantity : 0) + qty;
    if (newQty > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} in stock` });
    }

    if (existing) existing.quantity = newQty;
    else cart.items.push({ product: productId, quantity: qty });
    await cart.save();

    res.status(201).json(await cartResponse(req.user._id));
  })
);

// PUT /api/cart/:productId   body: { quantity }   (quantity < 1 removes the item)
router.put(
  '/:productId',
  asyncHandler(async (req, res) => {
    const qty = Number(req.body.quantity);
    if (!Number.isInteger(qty)) return res.status(400).json({ message: 'quantity must be an integer' });

    const cart = await Cart.findOne({ user: req.user._id });
    const item = cart && cart.items.find((i) => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });

    if (qty < 1) {
      cart.items = cart.items.filter((i) => i !== item);
    } else {
      const product = await Product.findById(req.params.productId);
      if (product && qty > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} in stock` });
      }
      item.quantity = qty;
    }
    await cart.save();
    res.json(await cartResponse(req.user._id));
  })
);

// DELETE /api/cart/:productId
router.delete(
  '/:productId',
  asyncHandler(async (req, res) => {
    await Cart.updateOne({ user: req.user._id }, { $pull: { items: { product: req.params.productId } } });
    res.json(await cartResponse(req.user._id));
  })
);

// DELETE /api/cart   (clear)
router.delete(
  '/',
  asyncHandler(async (req, res) => {
    await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
    res.json({ items: [], subtotal: 0 });
  })
);

module.exports = router;
