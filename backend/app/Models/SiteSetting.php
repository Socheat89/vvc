<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = [
        'website_name',
        'logo_name',
        'logo_name_kh',
        'logo_name_en',
        'logo',
        'about_content',
        'about_content_kh',
        'about_content_en',
        'privacy_content',
        'privacy_content_kh',
        'privacy_content_en',
        'terms_content',
        'terms_content_kh',
        'terms_content_en',
    ];
}
