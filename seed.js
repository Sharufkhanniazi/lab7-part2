// Run once:  npm run seed
// Loads the 3 products from your checkout page + an admin account.
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await Product.deleteMany();
  await Product.insertMany([
    {
      name: 'Classic T-Shirt',
      description: 'Comfortable cotton t-shirt',
      price: 24.99,
      category: 'clothing',
      stock: 50,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80',
    },
    {
      name: 'Running Shoes',
      description: 'Lightweight running shoes',
      price: 79.99,
      category: 'footwear',
      stock: 30,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80',
    },
    {
      name: 'Classic Watch',
      description: 'Elegant analog watch',
      price: 129.99,
      category: 'accessories',
      stock: 20,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80',
    },
  ]);

  if (!(await User.findOne({ email: 'admin@shopease.com' }))) {
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@shopease.com',
      password: 'admin123',
      role: 'admin',
    });
  }

  console.log('Seeded products and admin (admin@shopease.com / admin123)');
  process.exit(0);
})();
