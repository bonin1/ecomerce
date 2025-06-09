# 🛒 StrikeTech E-Commerce Platform

A comprehensive full-stack e-commerce platform built with **Next.js 15**, **Express.js**, and **MySQL**. This modern e-commerce solution features advanced user management, product catalog, order processing, admin panel, and much more.

## 🚀 Features

### Frontend (Next.js 15)
- **Modern React Architecture** with TypeScript
- **Responsive Design** with Tailwind CSS, Bootstrap, and SASS
- **Performance Optimized** with Turbopack
- **Google Authentication** integration
- **Real-time Notifications** with React Hot Toast
- **Interactive UI Components** with Material-UI and React Icons
- **Data Visualization** with Chart.js and Recharts
- **Smooth Animations** with Framer Motion

### Backend (Express.js)
- **RESTful API Architecture**
- **JWT Authentication** with cookie-based sessions
- **Two-Factor Authentication** (2FA) with TOTP
- **MySQL Database** with Sequelize ORM
- **File Upload Support** with Multer
- **Email Services** with Nodemailer and custom templates
- **PDF Generation** for documents and invoices
- **QR Code Generation** for orders and tracking
- **Rate Limiting** and security middleware
- **Device Fingerprinting** for security
- **Audit Logging** for admin activities

### Core Functionality

#### 🔐 Authentication & Security
- User registration with email verification
- Login with password or Google OAuth
- Two-factor authentication (TOTP)
- Password reset functionality
- Device trust management
- Session management with JWT
- Account lockout protection
- Activity logging

#### 👤 User Management
- Comprehensive user profiles
- Profile picture management
- Account settings and preferences
- Data export (JSON, CSV, PDF)
- Account deletion and reactivation
- Email change with verification
- Activity history tracking

#### 🛍️ E-Commerce Features
- Product catalog with categories
- Product search and filtering
- Shopping cart functionality
- Secure checkout process
- Multiple payment methods
- Order management and tracking
- Product reviews and ratings
- Wishlist functionality

#### 📋 Order Management
- Order creation and processing
- Real-time order tracking
- Order status updates
- Email notifications
- PDF invoice generation
- QR code tracking
- Shipping management
- Return/refund processing

#### 👨‍💼 Admin Panel
- Dashboard with analytics
- User management
- Product management
- Order management
- Content management
- System settings
- Audit logs
- Report generation

#### 💼 Additional Features
- Newsletter subscription/unsubscription
- Career listings and applications
- Affiliate program
- Help and support system
- Contact forms
- About pages
- Terms and conditions

## 🏗️ Project Structure

```
ecomerce/
├── ecomerce/                   # Main application folder
│   ├── app/                    # Next.js App Router
│   │   ├── components/         # React components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── cart/          # Shopping cart components
│   │   │   ├── checkout/      # Checkout process components
│   │   │   ├── global/        # Global UI components
│   │   │   ├── home/          # Homepage components
│   │   │   ├── product/       # Product-related components
│   │   │   └── ...            # Other feature components
│   │   ├── admin/             # Admin panel pages
│   │   │   ├── dashboard/     # Admin dashboard
│   │   │   ├── products/      # Product management
│   │   │   ├── orders/        # Order management
│   │   │   ├── users/         # User management
│   │   │   └── ...            # Other admin features
│   │   ├── profile/           # User profile pages
│   │   │   ├── settings/      # Account settings
│   │   │   ├── security/      # Security settings
│   │   │   ├── activity/      # Activity logs
│   │   │   └── ...            # Other profile features
│   │   ├── context/           # React Context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   └── ...                # Other pages and features
│   ├── backend/               # Express.js backend
│   │   ├── controller/        # Route controllers
│   │   │   ├── Admin/         # Admin-specific controllers
│   │   │   ├── Auth/          # Authentication controllers
│   │   │   ├── UserManagement/ # User management controllers
│   │   │   └── ...            # Other feature controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── model/             # Sequelize models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic services
│   │   ├── config/            # Configuration files
│   │   ├── template/          # Email templates
│   │   ├── static/            # Static assets
│   │   ├── utils/             # Backend utilities
│   │   └── views/             # EJS templates
│   ├── public/                # Static public assets
│   └── docs/                  # Documentation
└── README.md                  # This file
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS, Bootstrap 5, SASS
- **UI Components**: Material-UI, React Bootstrap
- **Icons**: React Icons, Bootstrap Icons
- **Charts**: Chart.js, Recharts
- **Animations**: Framer Motion
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT, Google OAuth
- **Email**: Nodemailer with Gmail
- **File Upload**: Multer
- **Security**: bcrypt, CORS, helmet
- **Validation**: express-validator
- **PDF Generation**: PDFKit
- **QR Codes**: qrcode
- **2FA**: Speakeasy
- **Session Management**: express-session

### Development Tools
- **Package Manager**: npm
- **Bundler**: Turbopack (Next.js 15)
- **Linting**: ESLint
- **Testing**: Jest, Supertest
- **Development**: Nodemon, Concurrently

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **MySQL** (v8 or higher)
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/bonin1/ecomerce.git
cd ecomerce/ecomerce
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost

# JWT Secrets
JWT_SECRET=your_jwt_secret_key
ADMIN_JWT_SECRET=your_admin_jwt_secret_key

# Application URLs
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:8080

# Email Configuration (Gmail)
EMAIL_USER=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Social Media Links (optional)
FACEBOOK_URL=https://facebook.com/your-page
TWITTER_URL=https://twitter.com/your-account
INSTAGRAM_URL=https://instagram.com/your-account

# Other Configuration
NODE_ENV=development
PORT=8080
LOGO_URL=http://localhost:8080/static/image/STRIKETECH-1.png
```

### 4. Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE your_database_name;
```

2. The application will automatically create and sync database tables on first run.

### 5. Start the Application

#### Development Mode (Recommended)
```bash
# Start both frontend and backend concurrently
npm run dev:all
```

#### Individual Services
```bash
# Frontend only (Next.js)
npm run dev

# Backend only (Express.js)
npm run server
```

#### Production Mode
```bash
# Build the application
npm run build

# Start production servers
npm start
```

## 🔧 Available Scripts

- `npm run dev` - Start Next.js development server with Turbopack
- `npm run server` - Start Express.js backend server
- `npm run dev:all` - Start both frontend and backend concurrently
- `npm run build` - Build the Next.js application for production
- `npm start` - Start both frontend and backend in production mode
- `npm run lint` - Run ESLint for code quality
- `npm test` - Run Jest tests

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/verify-email` - Email verification
- `POST /auth/verify-otp` - OTP verification
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset

### User Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile/update` - Update profile
- `PUT /api/profile/picture` - Update profile picture
- `POST /api/profile/2fa/setup` - Setup two-factor authentication
- `POST /api/profile/export` - Export user data

### Admin
- `POST /admin/login` - Admin login
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/orders` - Manage orders
- `GET /admin/users` - Manage users

### Products
- `GET /product/all` - Get all products
- `GET /product/:id` - Get product by ID
- `POST /product/create` - Create new product (admin)
- `PUT /product/:id` - Update product (admin)

### Orders
- `POST /orders/create` - Create new order
- `GET /orders/user/:userId` - Get user orders
- `PUT /orders/:id/status` - Update order status

### Other Features
- `POST /newsletter/subscribe` - Newsletter subscription
- `GET /careers/listings` - Career listings
- `POST /careers/apply/:careerId` - Job application

## 🗃️ Database Schema

### Key Models

#### Users
- Basic user information
- Authentication credentials
- Role-based access control
- Security settings (2FA, trusted devices)
- Profile data and preferences

#### Products
- Product information and media
- Categories and classifications
- Pricing and inventory
- Additional details (color, size, weight, etc.)

#### Orders
- Order information and status
- Order items and quantities
- Shipping and billing details
- Tracking information

#### Additional Models
- User activity logs
- Product reviews and ratings
- Career listings and applications
- Newsletter subscriptions
- Payment methods
- Audit logs

## 🔒 Security Features

- **JWT Authentication** with secure cookie storage
- **Two-Factor Authentication** using TOTP
- **Password Hashing** with bcrypt
- **Device Fingerprinting** for fraud detection
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **CORS Configuration** for cross-origin requests
- **Session Management** with automatic token refresh
- **Account Lockout** protection
- **Audit Logging** for admin actions

## 📱 Features in Detail

### User Management
- Comprehensive registration/login system
- Email verification with custom templates
- Password reset with secure tokens
- Two-factor authentication setup
- Profile management with image upload
- Activity tracking and export
- Account deletion with grace period

### E-Commerce
- Product catalog with rich media
- Category-based organization
- Advanced search and filtering
- Shopping cart with persistence
- Multi-step checkout process
- Payment integration ready
- Order tracking with QR codes
- Review and rating system

### Admin Panel
- Real-time dashboard with analytics
- User management and moderation
- Product inventory management
- Order processing and fulfillment
- Content management system
- System configuration
- Detailed reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Express.js community
- MySQL team
- All open-source contributors

---

**Built with ❤️ by StrikeTech**