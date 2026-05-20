<?php

namespace App\Interfaces\Offer;

interface OfferRepositoryInterface
{
    public function all(array $filters);
    public function findById(string $id);
    public function create(array $data);
    public function update(string $id, array $data);
    public function delete(string $id);
}
