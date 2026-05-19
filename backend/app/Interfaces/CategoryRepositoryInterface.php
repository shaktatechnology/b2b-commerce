<?php

namespace App\Interfaces;

interface CategoryRepositoryInterface
{
    public function all();
    public function getActive();
    public function findBySlug(string $slug);
    public function findById(string $id);
    public function create(array $data);
    public function update(string $id, array $data);
    public function delete(string $id);
}
