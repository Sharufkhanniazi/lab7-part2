const express = require('express');
const Product = require('../models/Product');
const { protect, adminOnly, asyncHandler } = require('../middleware/auth');

const router = express.Router();

// GET /api/products?search=shoe&category=footwear&minPrice=10&maxPrice=100
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, category, minPrice, maxPrice } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    const products = await Product.find(filter).sort('-createdAt');
    res.json({ count: products.length, products });
  })
);

// GET /api/products/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  })
);

// POST /api/products          (admin)
router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  })
);

// PUT /api/products/:id       (admin)
router.put(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  })
);

// DELETE /api/products/:id    (admin)
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  })
);

module.exports = router;
