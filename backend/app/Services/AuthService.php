<?php

namespace App\Services;

use App\Interfaces\AuthServiceInterface;
use App\Interfaces\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\PasswordReset;
use App\Notifications\WelcomeNotification;

class AuthService implements AuthServiceInterface
{
    protected $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function register(array $data)
    {
        $data['wholeseller_status'] = ($data['role'] ?? null) === 'wholesaler' ? 'pending' : 'approved';

        $data['password'] = Hash::make($data['password']);
        $user = $this->userRepository->create($data);
        $user->refresh();

        // Send welcome email (logs it)
        $user->notify(new WelcomeNotification($user));

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    public function login(array $credentials)
    {
        $user = $this->userRepository->findByEmail($credentials['email']);

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return null;
        }

        if ($user->role === 'wholesaler') {
            if ($user->wholeseller_status === 'pending') {
                return [
                    'blocked' => true,
                    'message' => 'Your wholesaler account is pending approval.',
                ];
            }

            if ($user->wholeseller_status === 'rejected') {
                return [
                    'blocked' => true,
                    'message' => 'Your wholesaler account has been rejected.',
                ];
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    public function logout($user)
    {
        return $user->currentAccessToken()->delete();
    }

    public function forgotPassword(string $email)
    {
        $status = Password::sendResetLink(['email' => $email]);
        return $status === Password::RESET_LINK_SENT;
    }

    public function resetPassword(array $data)
    {
        $status = Password::reset($data, function ($user, $password) {
            $user->password = Hash::make($password);
            $user->setRememberToken(Str::random(60));
            $user->save();
            event(new PasswordReset($user));
        });

        return $status === Password::PASSWORD_RESET;
    }

    public function getProfile($user)
    {
        return $user;
    }

    public function updateProfile($user, array $data)
    {
        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        return $this->userRepository->update($user->id, $data);
    }
}
