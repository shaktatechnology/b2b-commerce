<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function a_user_can_register_as_a_customer_by_default()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'role', 'is_verified'],
                    'access_token',
                    'token_type'
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'role' => 'customer',
        ]);
    }

    /** @test */
    public function a_user_can_register_as_a_wholesaler_with_pending_approval()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Wholesale Corp',
            'email' => 'b2b@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'wholesaler',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user.role', 'wholesaler')
            ->assertJsonPath('data.user.approval_state', 'pending');

        $this->assertDatabaseHas('users', [
            'email' => 'b2b@example.com',
            'role' => 'wholesaler',
            'approval_state' => 'pending',
        ]);
    }

    /** @test */
    public function a_user_cannot_register_with_an_invalid_role()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Hacker',
            'email' => 'hacker@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin', // restricted
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    /** @test */
    public function a_user_can_login_with_valid_credentials()
    {
        $user = User::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'jane@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'role'],
                    'access_token',
                    'token_type'
                ]
            ]);
    }

    /** @test */
    public function a_user_cannot_login_with_invalid_credentials()
    {
        User::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'jane@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials'
            ]);
    }

    /** @test */
    public function an_authenticated_user_can_retrieve_their_profile()
    {
        $user = User::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/profile');

        $response->assertStatus(200)
            ->assertJsonPath('data.email', 'jane@example.com');
    }

    /** @test */
    public function an_authenticated_user_can_update_their_profile()
    {
        $user = User::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/profile', [
            'name' => 'Jane Updated',
            'email' => 'jane.updated@example.com',
            'phone' => '+987654321',
            'company_name' => 'Jane Store',
            'address' => 'New Address',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Jane Updated')
            ->assertJsonPath('data.email', 'jane.updated@example.com')
            ->assertJsonPath('data.phone', '+987654321');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Jane Updated',
            'email' => 'jane.updated@example.com',
            'phone' => '+987654321',
            'company_name' => 'Jane Store',
            'address' => 'New Address',
        ]);
    }

    /** @test */
    public function an_authenticated_user_can_change_their_password()
    {
        $user = User::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/profile', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(200);

        // Verify the user can login with the new password
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'jane@example.com',
            'password' => 'newpassword123',
        ]);

        $loginResponse->assertStatus(200);
    }

    /** @test */
    public function a_user_can_request_a_password_reset_token()
    {
        User::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('password123'),
        ]);

        // We mock password broker behaviour
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'jane@example.com'
        ]);

        // Note: The reset link sending will depend on mailer. Since in local config it works,
        // it returns successful message or link sent.
        $response->assertStatus(200);
    }
}
