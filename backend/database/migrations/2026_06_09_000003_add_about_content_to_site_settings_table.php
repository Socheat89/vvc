<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('site_settings', 'about_content')) {
            return;
        }

        Schema::table('site_settings', function (Blueprint $table) {
            $table->text('about_content')->nullable()->after('logo');
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('site_settings', 'about_content')) {
            return;
        }

        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn('about_content');
        });
    }
};
