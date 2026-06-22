<?php

namespace App\Http\Controllers\Api\Offer;

use App\Http\Controllers\Controller;
use App\Interfaces\Offer\OfferServiceInterface;
use App\Http\Requests\Api\Offer\CreateOfferRequest;
use App\Http\Requests\Api\Offer\UpdateOfferRequest;
use Illuminate\Http\Request;
class OfferController extends Controller
{
    protected $offerService;

    public function __construct(OfferServiceInterface $offerService)
    {
        $this->offerService = $offerService;
    }

    /**
     * Display a listing of offers.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['placement', 'active']);

        // Non-admin can only view active offers
        if (!$request->user() || $request->user()->role !== 'admin') {
            $filters['active'] = true;
        }

        $offers = $this->offerService->getAllOffers($filters);

        return response()->json([
            'data' => $offers
        ]);
    }

    /**
     * Display the specified offer.
     */
    public function show(Request $request, string $id)
    {
        $offer = $this->offerService->getOfferById($id);

        // Non-admin can only view active offers
        if (!$request->user() || $request->user()->role !== 'admin') {
            $now = now();
            $isActive = $offer->is_active &&
                ($offer->starts_at === null || $offer->starts_at <= $now) &&
                ($offer->ends_at === null || $offer->ends_at >= $now);

            if (!$isActive) {
                return response()->json(['message' => 'Offer not found or inactive.'], 404);
            }
        }

        return response()->json([
            'data' => $offer
        ]);
    }

    /**
     * Store a newly created offer.
     */
    public function store(CreateOfferRequest $request)
    {
        $offer = $this->offerService->createOffer(array_merge(
            $request->validated(),
            ['image' => $request->file('image')]
        ));

        return response()->json([
            'message' => 'Offer created successfully',
            'data' => $offer
        ], 201);
    }

    /**
     * Update the specified offer.
     */
    public function update(UpdateOfferRequest $request, string $id)
    {
        $offer = $this->offerService->updateOffer($id, array_merge(
            $request->validated(),
            ['image' => $request->file('image')]
        ));

        return response()->json([
            'message' => 'Offer updated successfully',
            'data' => $offer
        ]);
    }

    /**
     * Remove the specified offer.
     */
    public function destroy(Request $request, string $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized: Admin access required.'], 403);
        }

        $this->offerService->deleteOffer($id);

        return response()->json([
            'message' => 'Offer deleted successfully'
        ]);
    }
}
