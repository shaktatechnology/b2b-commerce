<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WholesalerApprovalApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Owner',
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $this->customer = User::create([
            'name' => 'Regular Buyer',
            'email' => 'buyer@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);
    }

    /** @test */
    public function guest_users_cannot_access_wholesaler_approval_endpoints()
    {
        $wholesaler = $this->createWholesaler(false);

        $this->getJson('/api/admin/wholesalers/pending')->assertStatus(401);
        $this->patchJson("/api/admin/wholesalers/{$wholesaler->id}/approve")->assertStatus(401);
        $this->patchJson("/api/admin/wholesalers/{$wholesaler->id}/reject")->assertStatus(401);
    }

    /** @test */
    public function customer_users_cannot_access_wholesaler_approval_endpoints()
    {
        $wholesaler = $this->createWholesaler(false);

        $this->actingAs($this->customer, 'sanctum')
            ->getJson('/api/admin/wholesalers/pending')
            ->assertStatus(403);

        $this->actingAs($this->customer, 'sanctum')
            ->patchJson("/api/admin/wholesalers/{$wholesaler->id}/approve")
            ->assertStatus(403);

        $this->actingAs($this->customer, 'sanctum')
            ->patchJson("/api/admin/wholesalers/{$wholesaler->id}/reject")
            ->assertStatus(403);
    }

    /** @test */
    public function admin_can_list_only_unapproved_wholesalers()
    {
        $pendingWholesaler = $this->createWholesaler(false, 'pending@example.com');
        $this->createWholesaler(true, 'approved@example.com');
        $this->customer->update(['is_verified' => false]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/wholesalers/pending');

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Pending wholesalers retrieved successfully')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $pendingWholesaler->id)
            ->assertJsonPath('data.0.role', 'wholesaler')
            ->assertJsonPath('data.0.is_verified', false);
    }

    /** @test */
    public function admin_can_approve_a_wholesaler()
    {
        $wholesaler = $this->createWholesaler(false);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/admin/wholesalers/{$wholesaler->id}/approve");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Wholesaler approved successfully')
            ->assertJsonPath('data.id', $wholesaler->id)
            ->assertJsonPath('data.is_verified', true);

        $this->assertDatabaseHas('users', [
            'id' => $wholesaler->id,
            'role' => 'wholesaler',
            'is_verified' => true,
        ]);
    }

    /** @test */
    public function admin_can_reject_a_wholesaler_by_marking_them_unverified()
    {
        $wholesaler = $this->createWholesaler(true);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/admin/wholesalers/{$wholesaler->id}/reject");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Wholesaler rejected successfully')
            ->assertJsonPath('data.id', $wholesaler->id)
            ->assertJsonPath('data.is_verified', false);

        $this->assertDatabaseHas('users', [
            'id' => $wholesaler->id,
            'role' => 'wholesaler',
            'is_verified' => false,
        ]);
    }

    /** @test */
    public function admin_cannot_approve_or_reject_customer_users()
    {
        $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/admin/wholesalers/{$this->customer->id}/approve")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Only wholesaler users can be approved.');

        $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/admin/wholesalers/{$this->customer->id}/reject")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Only wholesaler users can be rejected.');

        $this->assertDatabaseHas('users', [
            'id' => $this->customer->id,
            'role' => 'customer',
            'is_verified' => false,
        ]);
    }

    private function createWholesaler(bool $isVerified, string $email = 'wholesaler@example.com'): User
    {
        return User::create([
            'name' => 'Wholesale Partner',
            'email' => $email,
            'password' => bcrypt('password123'),
            'role' => 'wholesaler',
            'is_verified' => $isVerified,
        ]);
    }
}
