<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Models\Setting;

class PayPalController extends Controller
{
    /**
     * Create a PayPal order.
     */
    public function createOrder(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_id' => 'required|string|exists:payments,id',
                'order_id' => 'required|string',
                'amount' => 'required|numeric|min:0.01',
            ]);

            $payment = Payment::findOrFail($validated['payment_id']);

            // Verify payment belongs to user's order
            if ($payment->order->user_id !== $request->user()->id) {
                abort(403, 'Unauthorized access to this payment.');
            }

            $clientId = Setting::get('paypal_client_id', '');
            $clientSecret = Setting::get('paypal_client_secret', '');
            $mode = Setting::get('paypal_mode', 'sandbox');

            if (!$clientId || !$clientSecret) {
                throw new \Exception('PayPal credentials not configured.');
            }

            $endpoint = $mode === 'live'
                ? 'https://api.paypal.com'
                : 'https://api.sandbox.paypal.com';

            // Get access token
            $tokenResponse = Http::asForm()
                ->withBasicAuth($clientId, $clientSecret)
                ->post("{$endpoint}/v1/oauth2/token", [
                    'grant_type' => 'client_credentials',
                ])
                ->throw();

            $accessToken = $tokenResponse->json('access_token');

            $payload = [
                'intent' => 'CAPTURE',
                'purchase_units' => [
                    [
                        'reference_id' => (string) $payment->id,
                        'amount' => [
                            'currency_code' => 'USD',
                            'value' => (string) number_format($validated['amount'], 2, '.', ''),
                        ],
                    ],
                ],
                'application_context' => [
                    'landing_page' => 'LOGIN',
                    'user_action' => 'PAY_NOW',
                ]
            ];

            Log::info('PayPal Order Payload: ', $payload);

            // Create order
            $orderResponse = Http::withToken($accessToken)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post("{$endpoint}/v2/checkout/orders", $payload)
                ->throw();

            $paypalOrder = $orderResponse->json();

            // Store PayPal order ID in payment record
            $payment->update([
                'gateway_response' => array_merge(
                    $payment->gateway_response ?? [],
                    ['paypal_order_id' => $paypalOrder['id']]
                ),
            ]);

            return response()->json([
                'message' => 'PayPal order created successfully',
                'paypal_order_id' => $paypalOrder['id'],
            ], 201);
        } catch (\Throwable $e) {
            $errorDetails = $e->getMessage();
            if ($e instanceof \Illuminate\Http\Client\RequestException) {
                $errorDetails = $e->response->body();
            }
            Log::error('PayPal order creation failed: ' . $errorDetails);
            return response()->json([
                'message' => 'Failed to create PayPal order',
                'error' => $errorDetails,
            ], 422);
        }
    }

    /**
     * Capture a PayPal order.
     */
    public function captureOrder(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_id' => 'required|string|exists:payments,id',
                'paypal_order_id' => 'required|string',
            ]);

            $payment = Payment::findOrFail($validated['payment_id']);

            // Verify payment belongs to user's order
            if ($payment->order->user_id !== $request->user()->id) {
                abort(403, 'Unauthorized access to this payment.');
            }

            $clientId = Setting::get('paypal_client_id', '');
            $clientSecret = Setting::get('paypal_client_secret', '');
            $mode = Setting::get('paypal_mode', 'sandbox');

            if (!$clientId || !$clientSecret) {
                throw new \Exception('PayPal credentials not configured.');
            }

            $endpoint = $mode === 'live'
                ? 'https://api.paypal.com'
                : 'https://api.sandbox.paypal.com';

            // Get access token
            $tokenResponse = Http::asForm()
                ->withBasicAuth($clientId, $clientSecret)
                ->post("{$endpoint}/v1/oauth2/token", [
                    'grant_type' => 'client_credentials',
                ])
                ->throw();

            $accessToken = $tokenResponse->json('access_token');

            // Capture order
            $captureResponse = Http::withToken($accessToken)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post("{$endpoint}/v2/checkout/orders/{$validated['paypal_order_id']}/capture", (object)[])
                ->throw();

            $captureData = $captureResponse->json();

            if ($captureData['status'] === 'COMPLETED') {
                // Update payment record
                $payment->update([
                    'status' => 'completed',
                    'transaction_id' => $captureData['id'],
                    'gateway_response' => $captureData,
                    'paid_at' => now(),
                ]);

                // Update order payment status
                $payment->order->update([
                    'payment_status' => 'paid',
                    'status' => 'confirmed',
                ]);

                return response()->json([
                    'message' => 'Payment captured successfully',
                    'payment_id' => $payment->id,
                    'order_id' => $payment->order->id,
                ]);
            } else {
                throw new \Exception('PayPal payment not completed: ' . $captureData['status']);
            }
        } catch (\Throwable $e) {
            Log::error('PayPal order capture failed: ' . $e->getMessage());

            // Mark payment as failed
            if (isset($payment)) {
                $payment->update([
                    'status' => 'failed',
                    'gateway_response' => ['error' => $e->getMessage()],
                ]);
            }

            return response()->json([
                'message' => 'Failed to capture PayPal payment',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Handle PayPal return redirect.
     */
    public function handleReturn(Request $request)
    {
        try {
            $paymentId = $request->query('payment_id');
            $paypalOrderId = $request->query('token');

            if (!$paymentId || !$paypalOrderId) {
                return redirect('/payment?error=invalid_params');
            }

            $payment = Payment::findOrFail($paymentId);

            // Store PayPal order ID for later processing
            return redirect("/payment?order_id={$payment->order_id}&payment_id={$paymentId}&gateway=paypal&token={$paypalOrderId}");
        } catch (\Throwable $e) {
            Log::error('PayPal return handling failed: ' . $e->getMessage());
            return redirect("/payment?error=" . urlencode($e->getMessage()));
        }
    }
}
