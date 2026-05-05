# ឯកសារយោង API VVC / VVC API Documentation

## មូលដ្ឋាន URL / Base URL
- **អភិវឌ្ឍ / Development**: `http://localhost:8000/api`
- **ប្រើប្រាស់ពិត / Production**: `https://your-domain.com/api`

## ការផ្ទៀងផ្ទាត់ / Authentication

### ការផ្ទៀងផ្ទាត់តាម Token (Sanctum) / Token-Based Authentication (Sanctum)
ច្រកចូលសម្រាប់អ្នកគ្រប់គ្រងទាំងអស់ត្រូវការកូនសោ Bearer ក្នុង header Authorization / All admin endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {token}
```

### ចូលគណនីដើម្បីទទួល Token / Login to Get Token
```
POST /login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

ចម្លើយ / Response:
{
  "message": "Login successful",
  "token": "1|abcdef...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

## ច្រកចូល / Endpoints

### ផលិតផល / Products

#### យកផលិតផលទាំងអស់ (សាធារណៈ) / Get All Products (Public)
```
GET /products
```
ចម្លើយ / Response: `{ "data": [...] }`

#### យកផលិតផលតាម ID (សាធារណៈ) / Get Product by ID (Public)
```
GET /products/{id}
```
ចម្លើយ / Response: `{ "data": {...} }`

#### បង្កើតផលិតផល (សម្រាប់ Admin ប៉ុណ្ណោះ) / Create Product (Admin Only)
```
POST /products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "stock": 100,
  "image": "https://...",
  "category_id": 1
}
```

#### កែប្រែផលិតផល (សម្រាប់ Admin ប៉ុណ្ណោះ) / Update Product (Admin Only)
```
PUT /products/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "price": 149.99,
  "stock": 50
}
```

#### លុបផលិតផល (សម្រាប់ Admin ប៉ុណ្ណោះ) / Delete Product (Admin Only)
```
DELETE /products/{id}
Authorization: Bearer {token}
```

### ប្រភេទ / Categories

#### យកប្រភេទទាំងអស់ (សាធារណៈ) / Get All Categories (Public)
```
GET /categories
```

#### យកប្រភេទតាម ID រួមផលិតផល (សាធារណៈ) / Get Category by ID with Products (Public)
```
GET /categories/{id}
```

#### បង្កើតប្រភេទ (សម្រាប់ Admin ប៉ុណ្ណោះ) / Create Category (Admin Only)
```
POST /categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Category Name",
  "description": "Category description"
}
```

#### កែប្រែប្រភេទ (សម្រាប់ Admin ប៉ុណ្ណោះ) / Update Category (Admin Only)
```
PUT /categories/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### លុបប្រភេទ (សម្រាប់ Admin ប៉ុណ្ណោះ) / Delete Category (Admin Only)
```
DELETE /categories/{id}
Authorization: Bearer {token}
```

### ការផ្ទៀងផ្ទាត់ / Authentication

#### យកអ្នកប្រើបច្ចុប្បន្ន (ត្រូវការផ្ទៀងផ្ទាត់) / Get Current User (Auth Required)
```
GET /me
Authorization: Bearer {token}
```

#### ចាកចេញ (ត្រូវការផ្ទៀងផ្ទាត់) / Logout (Auth Required)
```
POST /logout
Authorization: Bearer {token}
```

## ចម្លើយកំហុស / Error Responses

### 400 សំណើមិនត្រឹមត្រូវ / Bad Request
```json
{
  "message": "Validation failed",
  "errors": {
    "name": ["The name field is required"]
  }
}
```

### 401 មិនបានអនុញ្ញាត / Unauthorized
```json
{
  "message": "Invalid credentials"
}
```

### 403 ត្រូវបានហាម / Forbidden
```json
{
  "message": "Unauthorized - Admin access required"
}
```

### 404 រកមិនឃើញ / Not Found
```json
{
  "message": "Product not found"
}
```

## ឧទាហរណ៍ប្រើប្រាស់ជាមួយ cURL / Example Usage with cURL

### ចូលគណនី / Login
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### យកផលិតផលទាំងអស់ / Get All Products
```bash
curl http://localhost:8000/api/products
```

### បង្កើតផលិតផល (ជាមួយ token) / Create Product (with token)
```bash
curl -X POST http://localhost:8000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "description": "Great product",
    "price": 29.99,
    "stock": 50,
    "category_id": 1
  }'
```

## ទម្រង់សំណើ/ចម្លើយ / Request/Response Format

### Header សំណើ / Request Headers
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token} (for protected routes)
```

### Header ចម្លើយ / Response Headers
```
Content-Type: application/json
```

### កូដស្ថានភាព / Status Codes
- `200 OK` - ជោគជ័យ / Success
- `201 Created` - បានបង្កើតធនធាន / Resource created
- `400 Bad Request` - កំហុសពិនិត្យទិន្នន័យ / Validation error
- `401 Unauthorized` - ត្រូវការផ្ទៀងផ្ទាត់ / Authentication required
- `403 Forbidden` - មិនមានសិទ្ធិ / Permission denied
- `404 Not Found` - រកមិនឃើញធនធាន / Resource not found
- `500 Internal Server Error` - កំហុសម៉ាស៊ីនមេ / Server error

## ទំព័រ (អនាគត) / Pagination (Future Enhancement)
បច្ចុប្បន្ន ច្រកចូលទាំងអស់ត្រឡប់លទ្ធផលទាំងមូល។ កំណែក្រោយនឹងគាំទ្រ / Currently, all endpoints return all results. Future versions will support:
```
GET /products?page=1&per_page=20
```

## តម្រង (អនាគត) / Filtering (Future Enhancement)
នឹងគាំទ្រក្នុងអនាគត / Future support for:
```
GET /products?category_id=1&min_price=10&max_price=100
GET /products?search=keyword
```
