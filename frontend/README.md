# VVC - Full Stack Web Application Setup

## Project Structure

```
vvc_web/
├── backend/          # Laravel API Backend
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── composer.json
│   └── .env
├── frontend/         # React SPA Frontend
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Prerequisites

- **Backend**: PHP 8.2+, Composer, MySQL 8.0+
- **Frontend**: Node.js 18+, npm or yarn

## Backend Setup (Laravel API)

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Copy environment file
```bash
copy .env.example .env
```

### 3. Create MySQL Database
```bash
# Open MySQL and create database
CREATE DATABASE vvc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Install dependencies
```bash
composer install
```

### 5. Generate application key
```bash
php artisan key:generate
```

### 6. Run migrations
```bash
php artisan migrate
```

### 7. Seed the database (create admin user and sample data)
```bash
php artisan db:seed
```

### 8. Start the Laravel development server
```bash
php artisan serve
```

The backend will be available at `http://localhost:8000`

#### Admin Credentials (from seeder):
- Email: `admin@example.com`
- Password: `password123`

## Frontend Setup (React SPA)

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product by ID

#### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/{id}` - Get category by ID

### Authentication Endpoints

- `POST /api/login` - Login as admin
  - Body: `{ "email": "admin@example.com", "password": "password123" }`
  - Returns: `{ "token": "...", "user": {...} }`

- `POST /api/logout` - Logout (requires auth token)
- `GET /api/me` - Get current user (requires auth token)

### Admin-Only Endpoints (Requires Auth Token)

#### Products Management
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

#### Categories Management
- `POST /api/categories` - Create category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

## Frontend Features

### Public Pages
1. **Home Page** - Welcome page with features showcase
2. **Product List** - Grid display of all products
3. **Product Detail** - Detailed view of individual product

### Admin Pages
1. **Admin Login** - Authentication page for admin
2. **Dashboard** - Overview of statistics and recent products
3. **Manage Products** - Full CRUD operations for products

## Technology Stack

### Backend
- **Framework**: Laravel 11
- **Authentication**: Laravel Sanctum
- **Database**: MySQL
- **API Architecture**: RESTful API

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useEffect)

## Key Features

✅ **API-First Architecture** - Clean separation of concerns
✅ **SPA Navigation** - No page reloads, smooth transitions
✅ **Admin Authentication** - Secure token-based authentication
✅ **Public Access** - Users can browse products without login
✅ **CRUD Operations** - Full product management for admins
✅ **Responsive Design** - Works on desktop and mobile
✅ **Protected Routes** - Admin routes require authentication
✅ **Error Handling** - Comprehensive error messages and validation

## Development Workflow

1. **Backend Development**
   - Modify controllers, models, routes in `backend/app`
   - Create new migrations in `database/migrations`
   - Test endpoints with Postman or similar tool

2. **Frontend Development**
   - Modify React components in `src/pages`, `src/components`
   - Update API service in `src/services/api.js`
   - Changes automatically reload with Vite HMR

3. **Database Changes**
   - Create new migrations: `php artisan make:migration create_table_name`
   - Run migrations: `php artisan migrate`
   - Rollback: `php artisan migrate:rollback`

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
php artisan serve --port=8001
```

**Database connection error:**
- Verify MySQL is running
- Check `.env` file has correct DB credentials
- Ensure database exists: `CREATE DATABASE vvc_db;`

**Migration fails:**
```bash
# Check migration status
php artisan migrate:status

# Rollback and retry
php artisan migrate:rollback
php artisan migrate
```

### Frontend Issues

**Port 3000 already in use:**
```bash
npm run dev -- --port 3001
```

**Cannot connect to API:**
- Verify backend is running on port 8000
- Check CORS is allowed in Laravel (check `.env` CORS settings)
- Check network tab in browser DevTools for actual API errors

**Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Customization

### Add New Admin User
```bash
php artisan tinker

User::create([
    'name' => 'New Admin',
    'email' => 'newadmin@example.com',
    'password' => bcrypt('password'),
    'role' => 'admin'
]);

exit
```

### Add New Product Category
Navigate to Admin Dashboard → Products section (or via API):
```bash
POST /api/categories
{
  "name": "Electronics",
  "description": "Electronic devices"
}
```

### Modify Styling
Edit Tailwind configuration in `frontend/tailwind.config.js`

## Production Deployment

### Backend (Laravel)
```bash
# Build for production
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set production environment
APP_ENV=production
APP_DEBUG=false
```

### Frontend (React)
```bash
# Build for production
npm run build

# Deploy the dist/ folder to your hosting
```

## Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Vite Documentation](https://vitejs.dev)
- [Axios Documentation](https://axios-http.com)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API response in browser DevTools Network tab
3. Check Laravel logs: `storage/logs/laravel.log`
4. Check browser console for frontend errors
