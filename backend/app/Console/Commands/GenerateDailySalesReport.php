<?php

namespace App\Console\Commands;

use App\Services\AnalyticsService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Throwable;

class GenerateDailySalesReport extends Command
{
    protected $signature = 'analytics:generate-daily-sales-report
        {date? : Date to aggregate in YYYY-MM-DD format. Defaults to yesterday.}';

    protected $description = 'Generate or update the daily sales report for the previous day.';

    public function handle(AnalyticsService $analyticsService): int
    {
        try {
            $date = $this->argument('date')
                ? Carbon::parse($this->argument('date'))
                : now()->subDay();
        } catch (Throwable) {
            $this->error('Invalid date. Use YYYY-MM-DD format.');

            return self::FAILURE;
        }

        $report = $analyticsService->saveDailySalesReport($date);

        $this->info("Daily sales report saved for {$report->report_date->toDateString()}.");

        return self::SUCCESS;
    }
}
