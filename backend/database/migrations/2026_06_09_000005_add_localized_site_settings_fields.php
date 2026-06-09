<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const DEFAULT_ABOUT_CONTENT_EN = <<<'TEXT'
About Us
Welcome to Van Van Cambodia.
We supply beverage ingredients and packaging materials for cafes, bubble tea shops, drink shops, and small businesses. Our goal is to make it easier for customers to understand product quality, usage, and value before choosing.

What we supply: Bubble tea ingredients, syrups, jellies, plastic cups, bags, and related packaging materials.

Our mission: We focus on reliable quality, fair pricing, and fast service so business owners can buy with confidence.

Why choose us: We check products carefully, provide practical product information, and support customers with clear service.
TEXT;

    private const DEFAULT_PRIVACY_CONTENT_EN = <<<'TEXT'
Privacy Policy
We respect customer privacy and protect the personal information shared with us when ordering products.

Information we collect: We may collect your name, phone number, delivery address, and order details so we can process and deliver your order.

How we use information: We use customer information to confirm orders, arrange delivery, provide customer support, and share product or promotion updates when appropriate.

Information sharing: We do not sell or rent your personal information. Delivery details may be shared only with delivery partners when needed to complete an order.

Data protection: We use reasonable safeguards to protect customer information from unauthorized access, loss, or misuse.
TEXT;

    private const DEFAULT_TERMS_CONTENT_EN = <<<'TEXT'
Terms of Service
By placing an order with us, you agree to the following terms.

Products: We supply beverage ingredients and packaging materials such as bubble tea ingredients, plastic cups, bags, syrups, jellies, and related products. Product photos and descriptions are for reference and packaging may vary slightly from the manufacturer.

Prices and payment: Product prices may change based on market conditions. Once an order is confirmed, the confirmed price will not be changed for that order.

Delivery: Delivery is arranged after order confirmation. Delivery fees and timing depend on order size and customer location.

Exchange and refund: Purchased products are not refundable. We will exchange products if they are damaged due to our mistake, do not match the order, or are expired. Customers should check products immediately after receiving them and report issues within the stated claim period.
TEXT;

    public function up(): void
    {
        if (!Schema::hasColumn('site_settings', 'logo_name_kh')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->string('logo_name_kh')->nullable()->after('logo_name');
            });
        }

        if (!Schema::hasColumn('site_settings', 'logo_name_en')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->string('logo_name_en')->nullable()->after('logo_name_kh');
            });
        }

        if (!Schema::hasColumn('site_settings', 'about_content_kh')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->text('about_content_kh')->nullable()->after('about_content');
            });
        }

        if (!Schema::hasColumn('site_settings', 'about_content_en')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->text('about_content_en')->nullable()->after('about_content_kh');
            });
        }

        if (!Schema::hasColumn('site_settings', 'privacy_content_kh')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->text('privacy_content_kh')->nullable()->after('privacy_content');
            });
        }

        if (!Schema::hasColumn('site_settings', 'privacy_content_en')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->text('privacy_content_en')->nullable()->after('privacy_content_kh');
            });
        }

        if (!Schema::hasColumn('site_settings', 'terms_content_kh')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->text('terms_content_kh')->nullable()->after('terms_content');
            });
        }

        if (!Schema::hasColumn('site_settings', 'terms_content_en')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->text('terms_content_en')->nullable()->after('terms_content_kh');
            });
        }

        DB::table('site_settings')
            ->select([
                'id',
                'website_name',
                'logo_name',
                'logo_name_kh',
                'logo_name_en',
                'about_content',
                'about_content_kh',
                'about_content_en',
                'privacy_content',
                'privacy_content_kh',
                'privacy_content_en',
                'terms_content',
                'terms_content_kh',
                'terms_content_en',
            ])
            ->orderBy('id')
            ->get()
            ->each(function ($setting) {
                DB::table('site_settings')
                    ->where('id', $setting->id)
                    ->update([
                        'logo_name_kh' => $setting->logo_name_kh ?: ($setting->logo_name ?: $setting->website_name),
                        'logo_name_en' => $setting->logo_name_en ?: ($setting->logo_name ?: $setting->website_name),
                        'about_content_kh' => $setting->about_content_kh ?: $setting->about_content,
                        'about_content_en' => $setting->about_content_en ?: self::DEFAULT_ABOUT_CONTENT_EN,
                        'privacy_content_kh' => $setting->privacy_content_kh ?: $setting->privacy_content,
                        'privacy_content_en' => $setting->privacy_content_en ?: self::DEFAULT_PRIVACY_CONTENT_EN,
                        'terms_content_kh' => $setting->terms_content_kh ?: $setting->terms_content,
                        'terms_content_en' => $setting->terms_content_en ?: self::DEFAULT_TERMS_CONTENT_EN,
                    ]);
            });
    }

    public function down(): void
    {
        $columns = [
            'terms_content_en',
            'terms_content_kh',
            'privacy_content_en',
            'privacy_content_kh',
            'about_content_en',
            'about_content_kh',
            'logo_name_en',
            'logo_name_kh',
        ];

        foreach ($columns as $column) {
            if (Schema::hasColumn('site_settings', $column)) {
                Schema::table('site_settings', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }
};
