<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailySalesReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_date',
        'revenue',
        'order_count',
        'items_sold',
        'new_customer_count',
    ];

    protected $casts = [
        'report_date' => 'date',
        'revenue' => 'decimal:2',
        'order_count' => 'integer',
        'items_sold' => 'integer',
        'new_customer_count' => 'integer',
    ];
}
