<?php

namespace App\Services\Offer;

use App\Interfaces\Offer\OfferRepositoryInterface;
use App\Interfaces\Offer\OfferServiceInterface;
use Illuminate\Support\Facades\Storage;

class OfferService implements OfferServiceInterface
{
    protected $offerRepository;

    public function __construct(OfferRepositoryInterface $offerRepository)
    {
        $this->offerRepository = $offerRepository;
    }

    public function getAllOffers(array $filters)
    {
        return $this->offerRepository->all($filters);
    }

    public function getOfferById(string $id)
    {
        return $this->offerRepository->findById($id);
    }

    public function createOffer(array $data)
    {
        if (isset($data['image']) && $data['image']->isValid()) {
            $path = $data['image']->store('offers', 'public');
            $data['image_url'] = Storage::url($path);
        }

        return $this->offerRepository->create($data);
    }

    public function updateOffer(string $id, array $data)
    {
        if (isset($data['image']) && $data['image']->isValid()) {
            // Delete old image if it exists
            $offer = $this->offerRepository->findById($id);
            if ($offer->image_url) {
                $oldPath = str_replace('/storage/', '', $offer->image_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $data['image']->store('offers', 'public');
            $data['image_url'] = Storage::url($path);
        }

        return $this->offerRepository->update($id, $data);
    }

    public function deleteOffer(string $id)
    {
        $offer = $this->offerRepository->findById($id);

        if ($offer->image_url) {
            $oldPath = str_replace('/storage/', '', $offer->image_url);
            Storage::disk('public')->delete($oldPath);
        }

        return $this->offerRepository->delete($id);
    }
}
