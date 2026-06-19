<?php

namespace App\Repositories;

use App\Interfaces\UserRepositoryInterface;
use App\Models\User;

class UserRepository implements UserRepositoryInterface
{
    public function create(array $data)
    {
        return User::create($data);
    }

    public function findByEmail(string $email)
    {
        return User::where('email', $email)->first();
    }

    public function findById(string $id)
    {
        return User::findOrFail($id);
    }

    public function update(string $id, array $data)
    {
        $user = $this->findById($id);
        $user->update($data);
        return $user;
    }

    public function getPendingWholesalers()
    {
        return User::where('role', 'wholesaler')
            ->where('wholeseller_status', 'pending')
            ->get();
    }

    public function getAllWholesalers(array $filters = [])
    {
        $query = User::where('role', 'wholesaler');

        if (isset($filters['status']) && $filters['status'] !== 'all') {
            $query->where('wholeseller_status', $filters['status']);
        }

        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        return $query->latest()->get();
    }

    public function getAllUsers(array $filters = [])
    {
        $query = User::query();

        if (isset($filters['role']) && $filters['role'] !== 'all') {
            $query->where('role', $filters['role']);
        }

        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        return $query->latest()->get();
    }

    public function delete(string $id)
    {
        $user = $this->findById($id);
        return $user->delete();
    }

    public function getUserPurchaseHistory(string $userId)
    {
        $user = $this->findById($userId);
        return $user->orders()->with('items.variant.product')->latest()->get();
    }
}
