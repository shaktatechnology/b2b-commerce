<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class WholesalerApprovalApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function admin_can_list_pending_wholesalers()
    {
        $admin = $this->user('admin@example.com', 'admin');
        $pendingWholesaler = $this->user('pending@example.com', 'wholesaler', 'pending');
        $this->user('approved@example.com', 'wholesaler', 'approved');
        $this->user('customer@example.com', 'customer');

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/wholesalers/pending');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $pendingWholesaler->id)
            ->assertJsonPath('data.0.approval_state', 'pending');
    }

    /** @test */
    public function admin_can_approve_a_wholesaler()
    {
        $admin = $this->user('admin@example.com', 'admin');
        $wholesaler = $this->user('pending@example.com', 'wholesaler', 'pending');

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/wholesalers/{$wholesaler->id}/approve");

        $response->assertOk()
            ->assertJsonPath('data.id', $wholesaler->id)
            ->assertJsonPath('data.approval_state', 'approved');

        $this->assertDatabaseHas('users', [
            'id' => $wholesaler->id,
            'approval_state' => 'approved',
        ]);
    }

    /** @test */
    public function admin_can_reject_a_wholesaler()
    {
        $admin = $this->user('admin@example.com', 'admin');
        $wholesaler = $this->user('pending@example.com', 'wholesaler', 'pending');

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/wholesalers/{$wholesaler->id}/reject");

        $response->assertOk()
            ->assertJsonPath('data.id', $wholesaler->id)
            ->assertJsonPath('data.approval_state', 'rejected');

        $this->assertDatabaseHas('users', [
            'id' => $wholesaler->id,
            'approval_state' => 'rejected',
        ]);
    }

    /** @test */
    public function customer_users_are_not_affected_by_approval_actions()
    {
        $admin = $this->user('admin@example.com', 'admin');
        $customer = $this->user('customer@example.com', 'customer');

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/wholesalers/{$customer->id}/approve");

        $response->assertStatus(422);

        $this->assertDatabaseHas('users', [
            'id' => $customer->id,
            'role' => 'customer',
            'approval_state' => null,
        ]);
    }

    private function user(string $email, string $role, ?string $approvalState = null): User
    {
        return User::create([
            'name' => ucfirst(strtok($email, '@')),
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => $role,
            'approval_state' => $approvalState,
        ]);
    }
}
