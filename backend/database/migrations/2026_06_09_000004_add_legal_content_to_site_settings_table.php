<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('site_settings', 'privacy_content')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->text('privacy_content')->nullable()->after('about_content');
            });
        }

        if (!Schema::hasColumn('site_settings', 'terms_content')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->text('terms_content')->nullable()->after('privacy_content');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('site_settings', 'terms_content')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->dropColumn('terms_content');
            });
        }

        if (Schema::hasColumn('site_settings', 'privacy_content')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->dropColumn('privacy_content');
            });
        }
    }
};
