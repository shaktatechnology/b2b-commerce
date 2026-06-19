<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Interfaces\UserRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    protected $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Display a listing of all users.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'role' => $request->query('role', 'all'),
            'search' => $request->query('search', ''),
        ];

        $users = $this->userRepository->getAllUsers($filters);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Display the specified user's details.
     */
    public function show(string $id): JsonResponse
    {
        $user = $this->userRepository->findById($id);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Display the specified user's purchase history.
     */
    public function purchaseHistory(string $id): JsonResponse
    {
        $history = $this->userRepository->getUserPurchaseHistory($id);

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $this->userRepository->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }
}
