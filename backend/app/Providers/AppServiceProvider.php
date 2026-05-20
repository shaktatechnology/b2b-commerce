<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(\App\Interfaces\UserRepositoryInterface::class, \App\Repositories\UserRepository::class);
        $this->app->bind(\App\Interfaces\AuthServiceInterface::class, \App\Services\AuthService::class);
        
        $this->app->bind(\App\Interfaces\CategoryRepositoryInterface::class, \App\Repositories\CategoryRepository::class);
        $this->app->bind(\App\Interfaces\CategoryServiceInterface::class, \App\Services\CategoryService::class);
        
        $this->app->bind(\App\Interfaces\ProductRepositoryInterface::class, \App\Repositories\ProductRepository::class);
        $this->app->bind(\App\Interfaces\ProductServiceInterface::class, \App\Services\ProductService::class);

        $this->app->bind(\App\Interfaces\Offer\OfferRepositoryInterface::class, \App\Repositories\Offer\OfferRepository::class);
        $this->app->bind(\App\Interfaces\Offer\OfferServiceInterface::class, \App\Services\Offer\OfferService::class);

        $this->app->bind(\App\Interfaces\Discount\DiscountRepositoryInterface::class, \App\Repositories\Discount\DiscountRepository::class);
        $this->app->bind(\App\Interfaces\Discount\DiscountServiceInterface::class, \App\Services\Discount\DiscountService::class);

        $this->app->bind(\App\Interfaces\Cart\CartRepositoryInterface::class, \App\Repositories\Cart\CartRepository::class);
        $this->app->bind(\App\Interfaces\Cart\CartServiceInterface::class, \App\Services\Cart\CartService::class);

        $this->app->bind(\App\Interfaces\Order\OrderRepositoryInterface::class, \App\Repositories\Order\OrderRepository::class);
        $this->app->bind(\App\Interfaces\Order\OrderServiceInterface::class, \App\Services\Order\OrderService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Scramble::configure()
        ->withDocumentTransformers(function (OpenApi $openApi) {
            $openApi->secure(
                SecurityScheme::http('bearer')
            );
        });

        // Rate Limiters
        \Illuminate\Support\Facades\RateLimiter::for('login', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(5)->by($request->email . $request->ip());
        });

        \Illuminate\Support\Facades\RateLimiter::for('registration', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perHour(3)->by($request->ip());
        });

        \Illuminate\Support\Facades\RateLimiter::for('forgot-password', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perHour(3)->by($request->ip());
        });
    }
}
