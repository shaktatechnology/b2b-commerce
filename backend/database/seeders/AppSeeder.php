<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;
use App\Models\SocialLink;

class AppSeeder extends Seeder
{
    public function run(): void
    {
        // ── Settings ────────────────────────────────────────────────────
        $settings = [
            // General
            ['key' => 'site_name',           'value' => 'Shakta B2B Commerce',  'group' => 'general',  'type' => 'text',     'label' => 'Site Name'],
            ['key' => 'site_tagline',        'value' => 'Your trusted B2B marketplace', 'group' => 'general', 'type' => 'text', 'label' => 'Site Tagline'],
            ['key' => 'site_logo',           'value' => null,                    'group' => 'general',  'type' => 'image',    'label' => 'Site Logo'],
            ['key' => 'site_favicon',        'value' => null,                    'group' => 'general',  'type' => 'image',    'label' => 'Favicon'],
            ['key' => 'contact_email',       'value' => 'hello@example.com',     'group' => 'general',  'type' => 'email',    'label' => 'Contact Email'],
            ['key' => 'contact_phone',       'value' => '+1 (555) 000-0000',     'group' => 'general',  'type' => 'text',     'label' => 'Contact Phone'],
            ['key' => 'contact_address',     'value' => '123 Main St, City',     'group' => 'general',  'type' => 'textarea', 'label' => 'Contact Address'],
            ['key' => 'google_analytics',    'value' => null,                    'group' => 'general',  'type' => 'text',     'label' => 'Google Analytics ID'],
            ['key' => 'meta_description',    'value' => 'A modern B2B commerce platform.', 'group' => 'general', 'type' => 'textarea', 'label' => 'Meta Description'],
            ['key' => 'maintenance_mode',    'value' => '0',                     'group' => 'general',  'type' => 'boolean',  'label' => 'Maintenance Mode'],

            // Business
            ['key' => 'business_name',       'value' => 'Shakta Technology',     'group' => 'business', 'type' => 'text',     'label' => 'Business Name'],
            ['key' => 'business_email',      'value' => 'business@example.com',  'group' => 'business', 'type' => 'email',    'label' => 'Business Email'],
            ['key' => 'business_phone',      'value' => '+1 (555) 111-2222',     'group' => 'business', 'type' => 'text',     'label' => 'Business Phone'],
            ['key' => 'business_address',    'value' => '456 Commerce Ave, City','group' => 'business', 'type' => 'textarea', 'label' => 'Business Address'],
            ['key' => 'business_website',    'value' => 'https://shaktatech.com','group' => 'business', 'type' => 'url',      'label' => 'Business Website'],
            ['key' => 'business_pan',        'value' => null,                    'group' => 'business', 'type' => 'text',     'label' => 'PAN Number'],
            ['key' => 'business_vat',        'value' => null,                    'group' => 'business', 'type' => 'text',     'label' => 'VAT / GST Number'],
            ['key' => 'business_reg_number', 'value' => null,                    'group' => 'business', 'type' => 'text',     'label' => 'Registration Number'],
            ['key' => 'business_currency',   'value' => 'USD',                   'group' => 'business', 'type' => 'text',     'label' => 'Default Currency'],
            ['key' => 'business_timezone',   'value' => 'Asia/Kathmandu',        'group' => 'business', 'type' => 'text',     'label' => 'Timezone'],

            // Payment
            ['key' => 'payment_gateway',         'value' => 'esewa',             'group' => 'payment',  'type' => 'text',  'label' => 'Default Gateway'],
            ['key' => 'esewa_active',             'value' => '1',                 'group' => 'payment',  'type' => 'boolean', 'label' => 'eSewa Active'],
            ['key' => 'esewa_merchant_code',      'value' => 'EPAYTEST',          'group' => 'payment',  'type' => 'text',  'label' => 'eSewa Merchant Code'],
            ['key' => 'esewa_secret_key',         'value' => '8g7h3o91bh14',      'group' => 'payment',  'type' => 'text',  'label' => 'eSewa Secret Key'],
            ['key' => 'esewa_mode',               'value' => 'sandbox',           'group' => 'payment',  'type' => 'text',  'label' => 'eSewa Mode (sandbox/live)'],
            ['key' => 'paypal_active',            'value' => '0',                 'group' => 'payment',  'type' => 'boolean', 'label' => 'PayPal Active'],
            ['key' => 'paypal_client_id',         'value' => null,                'group' => 'payment',  'type' => 'text',  'label' => 'PayPal Client ID'],
            ['key' => 'paypal_client_secret',     'value' => null,                'group' => 'payment',  'type' => 'text',  'label' => 'PayPal Client Secret'],
            ['key' => 'paypal_mode',              'value' => 'sandbox',           'group' => 'payment',  'type' => 'text',  'label' => 'PayPal Mode (sandbox/live)'],

            // Social
            ['key' => 'facebook_url',    'value' => 'https://facebook.com',    'group' => 'social',   'type' => 'url',   'label' => 'Facebook URL'],
            ['key' => 'twitter_url',     'value' => 'https://twitter.com',     'group' => 'social',   'type' => 'url',   'label' => 'Twitter / X URL'],
            ['key' => 'instagram_url',   'value' => 'https://instagram.com',   'group' => 'social',   'type' => 'url',   'label' => 'Instagram URL'],
            ['key' => 'linkedin_url',    'value' => 'https://linkedin.com',    'group' => 'social',   'type' => 'url',   'label' => 'LinkedIn URL'],
            ['key' => 'youtube_url',     'value' => null,                      'group' => 'social',   'type' => 'url',   'label' => 'YouTube URL'],
            ['key' => 'tiktok_url',      'value' => null,                      'group' => 'social',   'type' => 'url',   'label' => 'TikTok URL'],
            ['key' => 'whatsapp_number', 'value' => null,                      'group' => 'social',   'type' => 'text',  'label' => 'WhatsApp Number'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }

        // ── Social Links ─────────────────────────────────────────────────
        $socialLinks = [
            ['platform' => 'facebook',  'label' => 'Facebook',  'url' => 'https://facebook.com',  'icon' => 'facebook',  'is_active' => true,  'sort_order' => 1],
            ['platform' => 'twitter',   'label' => 'Twitter/X', 'url' => 'https://twitter.com',   'icon' => 'twitter',   'is_active' => true,  'sort_order' => 2],
            ['platform' => 'instagram', 'label' => 'Instagram', 'url' => 'https://instagram.com', 'icon' => 'instagram', 'is_active' => true,  'sort_order' => 3],
            ['platform' => 'linkedin',  'label' => 'LinkedIn',  'url' => 'https://linkedin.com',  'icon' => 'linkedin',  'is_active' => true,  'sort_order' => 4],
            ['platform' => 'youtube',   'label' => 'YouTube',   'url' => 'https://youtube.com',   'icon' => 'youtube',   'is_active' => false, 'sort_order' => 5],
            ['platform' => 'github',    'label' => 'GitHub',    'url' => 'https://github.com',    'icon' => 'github',    'is_active' => true,  'sort_order' => 6],
        ];

        foreach ($socialLinks as $link) {
            SocialLink::updateOrCreate(['platform' => $link['platform']], $link);
        }
    }
}
