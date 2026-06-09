<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $fillable = [
        'title',
        'image',
        'tone',
        'position',
        'active',
        'show_on_home',
        'show_on_about',
    ];

    protected $casts = [
        'active' => 'boolean',
        'show_on_home' => 'boolean',
        'show_on_about' => 'boolean',
        'position' => 'integer',
    ];
}
