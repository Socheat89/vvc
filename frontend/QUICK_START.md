# សេចក្តីណែនាំចាប់ផ្តើមរហ័ស VVC / VVC Quick Start Guide

## តម្រូវការប្រព័ន្ធ / System Requirements
- PHP 8.2 ឬខ្ពស់ជាង / PHP 8.2 or higher
- Node.js 18 ឬខ្ពស់ជាង / Node.js 18 or higher
- MySQL 8.0 ឬខ្ពស់ជាង / MySQL 8.0 or higher
- Composer
- npm ឬ yarn / npm or yarn

## ចាប់ផ្តើមរហ័ស (Windows) / Quick Start (Windows)

### វិធី 1: ប្រើ Batch Script (ណែនាំ) / Method 1: Using Batch Script (Recommended)
```batch
# Double-click setup.bat to install everything
setup.bat

# Then double-click start.bat to run both servers
start.bat
```

### វិធី 2: ដំឡើងដោយដៃ / Method 2: Manual Setup
```batch
# Terminal 1 - Backend
cd backend
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## ចាប់ផ្តើមរហ័ស (Mac/Linux) / Quick Start (Mac/Linux)

### វិធី 1: ប្រើ Shell Script / Method 1: Using Shell Script
```bash
bash setup.sh
bash start.sh
```

### វិធី 2: ដំឡើងដោយដៃ / Method 2: Manual Setup
```bash
# Terminal 1 - Backend
cd backend
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## URLs បន្ទាប់ពីដំណើរការ / URLs After Starting

| សមាសភាគ / Component | URL | ចំណាំ / Notes |
|-----------|-----|-------|
| Frontend / ផ្នែកមុខ | http://localhost:3000 | កម្មវិធីចម្បង / Main application |
| Backend API / ផ្នែកក្រោយ | http://localhost:8000 | ច្រកចូល API / API endpoints |
| API Docs / ឯកសារ API | See API_DOCUMENTATION.md | ឯកសារយោង API ពេញលេញ / Full API reference |

## ចូលគណនីសាកល្បង / Demo Login

ប្រើព័ត៌មានទាំងនេះដើម្បីចូលជា admin / Use these credentials to login as admin:
- **អ៊ីមែល / Email**: admin@example.com
- **ពាក្យសម្ងាត់ / Password**: password123

## លំហូរការងារមូលដ្ឋាន / Basic Workflow

1. **ចូលទស្សនាវេបសាយសាធារណៈ / Visit Public Site**
  - ទៅកាន់ http://localhost:3000 / Go to http://localhost:3000
  - មើលផលិតផល (មិនចាំបាច់ចូល) / Browse products (no login needed)
  - មើលព័ត៌មានលម្អិតផលិតផល / View product details
  - មើលប្រភេទ / See categories

2. **ចូលជា Admin / Admin Login**
  - ចុច "Admin" នៅក្បាលទំព័រ / Click "Admin" in header
  - ចូលដោយប្រើគណនីសាកល្បង / Login with demo credentials
  - ចូលផ្ទាំងគ្រប់គ្រង / Access dashboard

3. **គ្រប់គ្រងផលិតផល / Manage Products**
  - មើលផលិតផលទាំងអស់នៅផ្ទាំងគ្រប់គ្រង / View all products in dashboard
  - ចុច "Products" នៅ sidebar / Click "Products" in sidebar
  - បន្ថែមផលិតផលថ្មី / Add new products
  - កែប្រែផលិតផលមានស្រាប់ / Edit existing products
  - លុបផលិតផល / Delete products
  - តម្រងតាមប្រភេទ / Filter by category

## ទិដ្ឋភាពរចនាសម្ព័ន្ធឯកសារ / File Structure Overview

```
backend/          ← Laravel API
├── app/          ← Models, Controllers, Middleware
├── routes/       ← API routes (api.php)
├── database/     ← Migrations and seeders
└── config/       ← Configuration files

frontend/         ← React SPA
├── src/
│   ├── pages/    ← Page components
│   ├── components/ ← Reusable components
│   ├── services/ ← API client
│   └── layouts/  ← Layout components
└── package.json  ← Dependencies
```

## ពាក្យបញ្ជាទូទៅ / Common Commands

### Backend (Laravel) / ផ្នែកក្រោយ (Laravel)
```bash
cd backend

# Create admin user / បង្កើតអ្នកគ្រប់គ្រង
php artisan tinker
User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => bcrypt('password'), 'role' => 'admin'])

# Refresh database (clear & reseed) / សម្អាត និងបញ្ចូលទិន្នន័យឡើងវិញ
php artisan migrate:refresh --seed

# Check database status / ពិនិត្យស្ថានភាពមូលដ្ឋានទិន្នន័យ
php artisan migrate:status

# Clear cache / សម្អាត cache
php artisan cache:clear
php artisan config:clear
```

### Frontend (React) / ផ្នែកមុខ (React)
```bash
cd frontend

# Run development server / ដំណើរការ dev server
npm run dev

# Build for production / បង្កើត build សម្រាប់ production
npm run build

# Preview production build / មើលការបង្កើត production
npm run preview

# Lint code / ពិនិត្យស្តង់ដារកូដ
npm run lint
```

## ដោះស្រាយបញ្ហា / Troubleshooting

### Backend មិនដំណើរការ / Backend won't start
```
Error: Address already in use
→ Run on different port: php artisan serve --port=8001
```

### កំហុសការតភ្ជាប់មូលដ្ឋានទិន្នន័យ / Database connection error
```
Error: SQLSTATE[HY000] [2002] No such file or directory
→ Ensure MySQL is running
→ Check credentials in .env file
```

### Frontend មិនអាចភ្ជាប់ API / Frontend can't reach API
```
Error: Network error
→ Check backend is running on 8000
→ Check CORS_ALLOWED_ORIGINS in .env
→ Verify API proxy in vite.config.js
```

### npm install បរាជ័យ / npm install fails
```
→ Clear cache: npm cache clean --force
→ Delete node_modules: rm -rf node_modules
→ Reinstall: npm install
```

### Composer install បរាជ័យ / Composer install fails
```
→ Update composer: composer self-update
→ Clear cache: composer clear-cache
→ Try again: composer install
```

## ការកំណត់បរិស្ថាន / Environment Configuration

### Backend .env / ផ្នែកក្រោយ .env
```env
APP_NAME=VVC
APP_ENV=local
APP_DEBUG=true
DB_HOST=127.0.0.1
DB_DATABASE=vvc_db
DB_USERNAME=root
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (vite.config.js) / ផ្នែកមុខ (vite.config.js)
```js
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000'
    }
  }
}
```

## សាកល្បង API / Testing the API

### ប្រើ cURL / Using cURL
```bash
# Get all products (public) / យកផលិតផលទាំងអស់ (សាធារណៈ)
curl http://localhost:8000/api/products

# Login as admin / ចូលជា admin
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Create product (with token) / បង្កើតផលិតផល (ជាមួយ token)
curl -X POST http://localhost:8000/api/products \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test product","price":99.99,"stock":10}'
```

### ប្រើ Browser DevTools / Using Browser DevTools
1. បើក http://localhost:3000 / Open http://localhost:3000
2. បើក DevTools (F12) / Open DevTools (F12)
3. ទៅកាន់ Network tab / Go to Network tab
4. ធ្វើសកម្មភាព ហើយពិនិត្យសំណើ/ចម្លើយ / Perform actions and inspect requests/responses

## តំណភ្ជាប់មានប្រយោជន៍ / Useful Links

- [Laravel Docs](https://laravel.com/docs)
- [React Docs](https://react.dev)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Vite Docs](https://vitejs.dev)
- [Sanctum Docs](https://laravel.com/docs/sanctum)

## ជំហានបន្ទាប់ / Next Steps

1. ✅ ស្វែងរក UI / Explore the UI
2. ✅ ពិនិត្យ API_DOCUMENTATION.md / Review API_DOCUMENTATION.md
3. ✅ ពិនិត្យ STRUCTURE.md សម្រាប់រចនាសម្ព័ន្ធកូដ / Check STRUCTURE.md for code organization
4. ✅ អាន FEATURES.md សម្រាប់សមត្ថភាពបច្ចុប្បន្ន / Read FEATURES.md for current capabilities
5. ✅ កែសម្រួលរចនាប័ទ្មនៅ tailwind.config.js / Customize styling in tailwind.config.js
6. ✅ បន្ថែមផលិតផលរបស់អ្នកតាម admin panel / Add your own products via admin panel
7. ✅ កែសម្រួល components តាមតម្រូវការ / Modify components as needed

## ដាក់ប្រើប្រាស់ Production / Production Deployment

មុនពេលដាក់ប្រើប្រាស់ / Before deploying:
1. [ ] កំណត់ `APP_DEBUG=false` ក្នុង .env / Set `APP_DEBUG=false` in .env
2. [ ] កំណត់ `APP_ENV=production` ក្នុង .env / Set `APP_ENV=production` in .env
3. [ ] រត់ `npm run build` ដើម្បីបង្កើត frontend build / Run `npm run build` to create frontend build
4. [ ] កំណត់ពាក្យសម្ងាត់ admin ខ្លាំង / Set strong admin password
5. [ ] កំណត់មូលដ្ឋានទិន្នន័យឲ្យត្រឹមត្រូវ / Configure proper database
6. [ ] បើក HTTPS/SSL / Enable HTTPS/SSL
7. [ ] កំណត់ CORS origins ត្រឹមត្រូវ / Set up proper CORS origins
8. [ ] កំណត់ email (បើចាំបាច់) / Configure email (if needed)
9. [ ] រៀបចំការបម្រុងទុក / Set up backups
10. [ ] បើកការតាមដាន/កំណត់ហេតុ / Enable monitoring/logging

## ទទួលជំនួយ / Getting Help

**ពិនិត្យសិន / Check these first:**
1. Browser console សម្រាប់កំហុស (F12) / Browser console for errors (F12)
2. Network tab ដើម្បីមើលសំណើ API / Network tab to see API requests
3. Laravel logs: `storage/logs/laravel.log`
4. ការកំណត់ .env / .env file settings
5. ស្ថានភាពការតភ្ជាប់មូលដ្ឋានទិន្នន័យ / Database connection status

**ឯកសារ / Documentation:**
- API_DOCUMENTATION.md - ឯកសារយោង API / API reference
- STRUCTURE.md - រចនាសម្ព័ន្ធកូដ / Code organization
- FEATURES.md - អ្វីដែលបានអនុវត្ត / What's implemented
- README.md - ឯកសារណែនាំពេញលេញ / Full setup guide

---

**រួចរាល់ចាប់ផ្តើមហើយឬនៅ? / Ready to start?** Run `setup.bat` (Windows) or `bash setup.sh` (Mac/Linux)!
