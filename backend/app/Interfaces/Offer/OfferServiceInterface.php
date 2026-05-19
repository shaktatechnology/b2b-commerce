<?php

namespace App\Interfaces\Offer;

interface OfferServiceInterface
{
    public function getAllOffers(array $filters);
    public function getOfferById(string $id);
    public function createOffer(array $data);
    public function updateOffer(string $id, array $data);
    public function deleteOffer(string $id);
}
