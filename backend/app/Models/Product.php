<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_code',
        'local_name',
        'name',
        'description',
        'item_type',
        'item_group',
        'base_unit',
        'alarm_qty',
        'price',
        'wholesale_price',
        'partner_price',
        'stock',
        'image',
        'unit_set_name',
        'memo',
        'revenue_account',
        'asset',
        'cogs',
        'category_id'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'partner_price' => 'decimal:2',
        'alarm_qty' => 'integer',
        'stock' => 'integer'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
