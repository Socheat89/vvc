<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('website_name')->default('Van Van Cambodia');
            $table->string('logo_name')->nullable();
            $table->string('logo')->nullable();
            $table->text('about_content')->nullable();
            $table->text('privacy_content')->nullable();
            $table->text('terms_content')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
