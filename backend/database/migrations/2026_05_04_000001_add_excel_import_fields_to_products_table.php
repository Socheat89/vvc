<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('item_code')->nullable()->unique()->after('id');
            $table->string('local_name')->nullable()->after('item_code');
            $table->string('item_type')->nullable()->after('description');
            $table->string('item_group')->nullable()->after('item_type');
            $table->string('base_unit')->nullable()->after('item_group');
            $table->integer('alarm_qty')->nullable()->after('base_unit');
            $table->decimal('wholesale_price', 10, 2)->nullable()->after('price');
            $table->decimal('partner_price', 10, 2)->nullable()->after('wholesale_price');
            $table->string('unit_set_name')->nullable()->after('alarm_qty');
            $table->text('memo')->nullable()->after('unit_set_name');
            $table->string('revenue_account')->nullable()->after('memo');
            $table->string('asset')->nullable()->after('revenue_account');
            $table->string('cogs')->nullable()->after('asset');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_item_code_unique');
            $table->dropColumn([
                'item_code',
                'local_name',
                'item_type',
                'item_group',
                'base_unit',
                'alarm_qty',
                'wholesale_price',
                'partner_price',
                'unit_set_name',
                'memo',
                'revenue_account',
                'asset',
                'cogs',
            ]);
        });
    }
};
