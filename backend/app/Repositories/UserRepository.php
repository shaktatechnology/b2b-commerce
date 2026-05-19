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
}
