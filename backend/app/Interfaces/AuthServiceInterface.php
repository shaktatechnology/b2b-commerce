<?php

namespace App\Interfaces;

interface AuthServiceInterface
{
    public function register(array $data);
    public function login(array $credentials);
    public function logout($user);
    public function forgotPassword(string $email);
    public function resetPassword(array $data);
    public function getProfile($user);
    public function updateProfile($user, array $data);
}
