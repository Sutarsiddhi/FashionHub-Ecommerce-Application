# Django Ecommerce Project

A full-stack ecommerce web application built with Django REST Framework and React. The project includes product browsing, category filtering, user authentication, cart management, checkout, Cash on Delivery orders, and Razorpay online payment support.

## Tech Stack

### Backend
- Django 5
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Razorpay Payment Gateway
- Python Dotenv

### Frontend
- React
- Vite
- React Router
- Tailwind CSS
- React Icons

## Features

- User registration and login
- JWT-based authentication
- Product listing
- Product details page
- Category and search filtering
- Add to cart
- Update cart quantity
- Remove cart items
- Checkout page
- Cash on Delivery order creation
- Razorpay online payment integration
- Protected checkout route
- Django admin support

## Project Structure

```text
Django_Ecommerce_project/
├── backend/
│   ├── backend/
│   ├── store/
│   ├── manage.py
│   └── products/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
└── README.md

Backend Setup
Go to the backend folder:
cd backend
Create and activate a virtual environment:
python -m venv venv
venv\Scripts\activate
Install backend dependencies:
pip install django djangorestframework django-cors-headers djangorestframework-simplejwt psycopg2-binary python-dotenv pillow razorpay
Create a .env file inside the backend folder:
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
Apply migrations:
python manage.py migrate
Create a superuser:
python manage.py createsuperuser
Run the backend server:
python manage.py runserver
Backend will run at:

http://127.0.0.1:8000
Frontend Setup
Go to the frontend folder:
cd frontend
Install frontend dependencies:
npm install
Create a .env file inside the frontend folder:
VITE_DJANGO_BASE_URL=http://127.0.0.1:8000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
Start the frontend development server:
npm run dev
Frontend will run at:

http://localhost:5173
API Endpoints
Authentication
POST /api/register/
POST /api/token/
POST /api/token/refresh/
Products and Categories
GET /api/products/
GET /api/products/<id>/
GET /api/categories/
Cart
GET  /api/cart/
POST /api/cart/add/
POST /api/cart/update/
POST /api/cart/remove/
Orders
POST /api/orders/create/
Payments
POST /api/payments/razorpay/create-order/
POST /api/payments/razorpay/verify/
Admin Panel
The Django admin panel is available at:

http://127.0.0.1:8000/admin/
Use the superuser account to manage products, categories, carts, and orders.

Running the Full Project
Start the backend:

cd backend
python manage.py runserver
Start the frontend in another terminal:

cd frontend
npm run dev
Then open:

http://localhost:5173
Notes
PostgreSQL must be installed and running before starting the backend.
Razorpay keys are required for online payment functionality.
Cash on Delivery works without Razorpay configuration.
Product images are served from Django media files during development.
