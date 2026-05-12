# Project Structure

```
vvc_web/
│
├── backend/                          # Laravel REST API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── Api/
│   │   │   │       ├── ProductController.php      # Product CRUD operations
│   │   │   │       ├── CategoryController.php     # Category management
│   │   │   │       └── AuthController.php         # Authentication
│   │   │   ├── Middleware/
│   │   │   │   └── AdminMiddleware.php            # Admin role verification
│   │   │   └── Kernel.php                         # Middleware registration
│   │   ├── Models/
│   │   │   ├── User.php                           # Admin user model
│   │   │   ├── Product.php                        # Product model
│   │   │   └── Category.php                       # Category model
│   │   ├── Application.php                        # Application bootstrap
│   │   └── Exceptions/
│   │       └── Handler.php                        # Exception handling
│   │
│   ├── database/
│   │   ├── migrations/                            # Database migrations
│   │   │   ├── 2024_01_01_000000_create_users_table.php
│   │   │   ├── 2024_01_01_000001_create_categories_table.php
│   │   │   ├── 2024_01_01_000002_create_products_table.php
│   │   │   └── 2024_01_01_000003_create_personal_access_tokens_table.php
│   │   └── seeders/
│   │       └── DatabaseSeeder.php                 # Populate initial data
│   │
│   ├── routes/
│   │   ├── api.php                                # API route definitions
│   │   └── web.php                                # Web route definitions
│   │
│   ├── config/
│   │   ├── database.php                           # Database configuration
│   │   ├── auth.php                               # Authentication config
│   │   ├── cors.php                               # CORS settings
│   │   ├── cache.php                              # Cache configuration
│   │   ├── queue.php                              # Queue configuration
│   │   ├── session.php                            # Session configuration
│   │   ├── logging.php                            # Logging configuration
│   │   └── mail.php                               # Mail configuration
│   │
│   ├── bootstrap/
│   │   └── app.php                                # Application bootstrap
│   │
│   ├── storage/                                   # File storage
│   ├── .env.example                               # Environment template
│   ├── composer.json                              # PHP dependencies
│   ├── .gitignore                                 # Git ignore rules
│   └── README.md
│
├── frontend/                         # React SPA Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx                         # Navigation header
│   │   │   ├── Footer.jsx                         # Footer component
│   │   │   └── ProtectedRoute.jsx                 # Route protection
│   │   │
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── Home.jsx                       # Landing page
│   │   │   │   ├── ProductList.jsx                # Product grid
│   │   │   │   └── ProductDetail.jsx              # Product details
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx                 # Admin authentication
│   │   │       ├── Dashboard.jsx                  # Statistics & overview
│   │   │       └── ManageProducts.jsx             # Product management UI
│   │   │
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx                   # Public site layout
│   │   │   └── AdminLayout.jsx                    # Admin dashboard layout
│   │   │
│   │   ├── services/
│   │   │   └── api.js                             # API client & endpoints
│   │   │
│   │   ├── App.jsx                                # Main App component
│   │   ├── main.jsx                               # React entry point
│   │   └── index.css                              # Tailwind import
│   │
│   ├── index.html                                 # HTML entry point
│   ├── package.json                               # NPM dependencies
│   ├── vite.config.js                             # Vite configuration
│   ├── tailwind.config.js                         # Tailwind configuration
│   ├── postcss.config.js                          # PostCSS configuration
│   ├── .eslintrc.cjs                              # ESLint configuration
│   ├── .gitignore                                 # Git ignore rules
│   └── .eslintignore                              # ESLint ignore rules
│
├── setup.bat                                      # Windows setup script
├── setup.sh                                       # Linux/Mac setup script
├── start.bat                                      # Windows start script
├── start.sh                                       # Linux/Mac start script
├── README.md                                      # Project documentation
├── API_DOCUMENTATION.md                           # API reference
├── STRUCTURE.md                                   # This file
└── .gitignore                                     # Root git ignore

```

## Key Files Explained

### Backend Key Files

**Controllers** (`app/Http/Controllers/Api/`)
- Handle incoming requests
- Validate data
- Call models
- Return JSON responses

**Models** (`app/Models/`)
- Define database schema
- Handle data relationships
- Provide query methods

**Migrations** (`database/migrations/`)
- Define database structure
- Create tables and relationships
- Version controlled database changes

**Routes** (`routes/api.php`)
- Map HTTP requests to controllers
- Define public vs protected routes
- Apply middleware

**Middleware** (`app/Http/Middleware/`)
- Check admin role
- Authenticate requests
- Apply security rules

### Frontend Key Files

**Pages** (`src/pages/`)
- Full page components
- Handle complex logic
- Connect to API

**Components** (`src/components/`)
- Reusable UI elements
- Small, focused logic
- Stateless when possible

**Layouts** (`src/layouts/`)
- Wrap pages with common UI
- Header/Footer/Sidebar
- Navigation structure

**API Service** (`src/services/api.js`)
- Centralized API calls
- Token management
- Error handling

**App.jsx**
- Router configuration
- Main application component
- Route definitions

## Technology Stack

### Backend
- **Framework**: Laravel 11
- **Authentication**: Laravel Sanctum (JWT-like tokens)
- **Database**: MySQL
- **HTTP Client**: Axios (from frontend)
- **Language**: PHP 8.2+

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Router**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Language**: JavaScript (ES6+/JSX)

## Data Flow

### Public Product Viewing
1. User visits `http://localhost:3000/products`
2. ProductList component calls `productService.getAll()`
3. API service sends GET to `http://localhost:8000/api/products`
4. ProductController returns all products
5. React renders product grid

### Admin Product Management
1. Admin logs in with email/password
2. AuthController validates and returns token
3. Token stored in localStorage
4. Protected routes check for token
5. Admin modifies products via ManageProducts component
6. API calls include Authorization header with token
7. AdminMiddleware verifies admin role
8. ProductController performs CRUD operation
9. Response sent back and UI updated

## Security Features

✅ **Role-Based Access Control** - Only admins can manage products
✅ **Token Authentication** - Sanctum tokens for API security
✅ **CORS Protection** - Configured allowed origins
✅ **Input Validation** - Server-side validation on all inputs
✅ **SQL Injection Protection** - Eloquent ORM escapes queries
✅ **CSRF Protection** - Built into Laravel
✅ **Password Hashing** - bcrypt hashing for passwords
✅ **Protected Routes** - Frontend route guards

## Deployment Considerations

- Move `.env` values to environment variables
- Set `APP_DEBUG=false` in production
- Enable HTTPS
- Use proper error logging
- Implement rate limiting
- Add request caching
- Use CDN for static assets
- Database backups
- SSL certificates
