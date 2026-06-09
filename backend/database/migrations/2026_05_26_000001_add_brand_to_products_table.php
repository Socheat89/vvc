<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('products', 'brand')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            $table->string('brand')->nullable()->after('item_group');
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('products', 'brand')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('brand');
        });
    }
};
