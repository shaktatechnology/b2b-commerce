<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;
use App\Models\SocialLink;

class AppSeeder extends Seeder
{
    public function run(): void
    {
        // ── General Settings ────────────────────────────────────────────
        $settings = [
            // General
            ['key' => 'site_name',        'value' => 'Shakta Starter Kit', 'group' => 'general',    'type' => 'text',     'label' => 'Site Name'],
            ['key' => 'site_tagline',     'value' => 'A modern full-stack starter kit', 'group' => 'general', 'type' => 'text', 'label' => 'Tagline'],
            ['key' => 'site_logo',        'value' => null,                  'group' => 'general',    'type' => 'image',    'label' => 'Site Logo'],
            ['key' => 'site_favicon',     'value' => null,                  'group' => 'general',    'type' => 'image',    'label' => 'Favicon'],
            ['key' => 'maintenance_mode', 'value' => '0',                   'group' => 'general',    'type' => 'boolean',  'label' => 'Maintenance Mode'],

            // Contact
            ['key' => 'contact_email',    'value' => 'hello@example.com',   'group' => 'contact',    'type' => 'email',    'label' => 'Contact Email'],
            ['key' => 'contact_phone',    'value' => '+1 (555) 000-0000',   'group' => 'contact',    'type' => 'text',     'label' => 'Phone Number'],
            ['key' => 'contact_address',  'value' => '123 Main St, City',   'group' => 'contact',    'type' => 'textarea', 'label' => 'Address'],

            // SEO
            ['key' => 'meta_description', 'value' => 'A modern full-stack starter kit built with Laravel and Next.js.', 'group' => 'seo', 'type' => 'textarea', 'label' => 'Meta Description'],
            ['key' => 'meta_keywords',    'value' => 'laravel, nextjs, starter kit', 'group' => 'seo', 'type' => 'text', 'label' => 'Meta Keywords'],
            ['key' => 'og_image',         'value' => null,                  'group' => 'seo',        'type' => 'image',    'label' => 'OG Image'],

            // Appearance
            ['key' => 'primary_color',    'value' => '#6366f1',             'group' => 'appearance', 'type' => 'text',     'label' => 'Primary Color'],
            ['key' => 'footer_text',      'value' => '© 2026 Shakta. All rights reserved.', 'group' => 'appearance', 'type' => 'textarea', 'label' => 'Footer Text'],
            ['key' => 'google_analytics', 'value' => null,                  'group' => 'appearance', 'type' => 'text',     'label' => 'Google Analytics ID'],
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
