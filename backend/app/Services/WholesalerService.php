<?php

namespace App\Services;

use App\Interfaces\WholesalerServiceInterface;
use App\Interfaces\UserRepositoryInterface;

class WholesalerService implements WholesalerServiceInterface
{
    protected $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function getPendingWholesalers()
    {
        return $this->userRepository->getPendingWholesalers();
    }

    public function approveWholesaler(string $id)
    {
        return $this->userRepository->update($id, ['wholeseller_status' => 'approved']);
    }

    public function rejectWholesaler(string $id)
    {
        return $this->userRepository->update($id, ['wholeseller_status' => 'rejected']);
    }
}
