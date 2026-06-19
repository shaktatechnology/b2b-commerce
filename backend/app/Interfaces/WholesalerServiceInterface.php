<?php

namespace App\Interfaces;

interface WholesalerServiceInterface
{
    public function getPendingWholesalers();
    public function getAllWholesalers(array $filters = []);
    public function approveWholesaler(string $id);
    public function rejectWholesaler(string $id);
}
