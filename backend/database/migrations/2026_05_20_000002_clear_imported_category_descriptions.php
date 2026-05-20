<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('categories')
            ->where('description', 'Imported from product Excel file')
            ->update(['description' => null]);
    }

    public function down(): void
    {
        //
    }
};
