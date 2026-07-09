<?php

namespace App\Services;

use App\Interfaces\WholesalerServiceInterface;
use App\Interfaces\UserRepositoryInterface;
use App\Notifications\WholesalerStatusNotification;

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

    public function getAllWholesalers(array $filters = [])
    {
        return $this->userRepository->getAllWholesalers($filters);
    }

    public function approveWholesaler(string $id)
    {
        $user = $this->userRepository->update($id, [
            'wholeseller_status' => 'approved',
            'is_verified' => true
        ]);

        $user->notify(new WholesalerStatusNotification('approved'));

        return $user;
    }

    public function rejectWholesaler(string $id)
    {
        $user = $this->userRepository->update($id, [
            'wholeseller_status' => 'rejected',
            'is_verified' => false
        ]);

        $user->notify(new WholesalerStatusNotification('rejected'));

        return $user;
    }
}
