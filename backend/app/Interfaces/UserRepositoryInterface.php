<?php

namespace App\Interfaces;

interface UserRepositoryInterface
{
    public function create(array $data);
    public function findByEmail(string $email);
    public function findById(string $id);
    public function update(string $id, array $data);
}
