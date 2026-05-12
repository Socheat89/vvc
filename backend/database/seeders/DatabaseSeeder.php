<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
            'role' => 'admin'
        ]);

        // Create categories
        $categories = [
            ['name' => 'Electronics', 'description' => 'Electronic devices and gadgets'],
            ['name' => 'Clothing', 'description' => 'Apparel and fashion items'],
            ['name' => 'Books', 'description' => 'Books and literature'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        // Create sample products
        Product::create([
            'name' => 'Wireless Headphones',
            'description' => 'High-quality wireless headphones with noise cancellation',
            'price' => 99.99,
            'stock' => 50,
            'image' => 'https://via.placeholder.com/300x300?text=Headphones',
            'category_id' => 1
        ]);

        Product::create([
            'name' => 'Smart Watch',
            'description' => 'Advanced smartwatch with fitness tracking',
            'price' => 199.99,
            'stock' => 30,
            'image' => 'https://via.placeholder.com/300x300?text=SmartWatch',
            'category_id' => 1
        ]);

        Product::create([
            'name' => 'T-Shirt',
            'description' => 'Comfortable cotton t-shirt',
            'price' => 19.99,
            'stock' => 100,
            'image' => 'https://via.placeholder.com/300x300?text=TShirt',
            'category_id' => 2
        ]);

        Product::create([
            'name' => 'Web Development Guide',
            'description' => 'Learn web development from scratch',
            'price' => 29.99,
            'stock' => 25,
            'image' => 'https://via.placeholder.com/300x300?text=Book',
            'category_id' => 3
        ]);
    }
}
