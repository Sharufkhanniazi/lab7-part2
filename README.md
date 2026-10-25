# ShopEase API (Lab 4)

REST API with persistent storage (MongoDB) for the ShopEase store from Lab 3.
Stack: Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt.

## Setup
```bash
npm install
cp .env.example .env      # then edit JWT_SECRET (and MONGO_URI if needed)
npm run seed              # loads the 3 products + admin user
npm run dev               # http://localhost:5000
```
Requires MongoDB running locally (or an Atlas URI in `MONGO_URI`).
Seeded admin: `admin@shopease.com` / `admin123`

## Endpoints
Protected routes need the header `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Page | Purpose |
|---|---|---|---|---|
| POST | /api/auth/signup | – | signup.html | Create account |
| POST | /api/auth/login | – | login.html | Login, returns JWT |
| GET | /api/auth/me | user | – | Current user |
| GET | /api/products | – | index.html | List (search, category, minPrice, maxPrice) |
| GET | /api/products/:id | – | index.html | Single product |
| POST | /api/products | admin | – | Create product |
| PUT | /api/products/:id | admin | – | Update product |
| DELETE | /api/products/:id | admin | – | Delete product |
| GET | /api/cart | user | cart.html | View cart + subtotal |
| POST | /api/cart | user | index.html | Add item `{productId, quantity}` |
| PUT | /api/cart/:productId | user | cart.html | Set quantity (<1 removes) |
| DELETE | /api/cart/:productId | user | cart.html | Remove item |
| DELETE | /api/cart | user | cart.html | Clear cart |
| POST | /api/orders | user | checkout.html | Place order from cart |
| GET | /api/orders | user | – | My orders |
| GET | /api/orders/:id | user/admin | – | One order |
| PATCH | /api/orders/:id/status | admin | – | Update status |

## Example requests
```bash
# Signup
curl -X POST localhost:5000/api/auth/signup -H "Content-Type: application/json" \
 -d '{"firstName":"Ali","lastName":"Khan","email":"ali@test.com","phone":"+923001234567","password":"secret123","confirmPassword":"secret123"}'

# Login (copy the token)
curl -X POST localhost:5000/api/auth/login -H "Content-Type: application/json" \
 -d '{"email":"ali@test.com","password":"secret123"}'

# Add to cart
curl -X POST localhost:5000/api/cart -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" \
 -d '{"productId":"PRODUCT_ID","quantity":2}'

# Place order
curl -X POST localhost:5000/api/orders -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" \
 -d '{"billing":{"firstName":"Ali","lastName":"Khan","email":"ali@test.com","phone":"+923001234567","address":"House 1, Street 2","city":"Islamabad","postalCode":"44000"},"paymentMethod":"cod"}'
```

## Calling the API from your HTML (example for login.html)
```js
const res = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await res.json();
if (res.ok) { localStorage.setItem('token', data.token); location.href = 'index.html'; }
else alert(data.message);
```
