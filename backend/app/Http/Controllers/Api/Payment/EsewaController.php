<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;

class EsewaController extends Controller
{
    /**
     * Handle eSewa payment success callback.
     */
    public function handleSuccess(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'transaction_uuid' => 'required|string',
                'status' => 'required|string',
                'signed_field_names' => 'required|string',
                'signature' => 'required|string',
                'total_amount' => 'required|numeric',
                'product_code' => 'required|string',
                'oid' => 'required|string',
            ]);

            // Find payment by transaction UUID
            $payment = Payment::where('transaction_id', $validated['transaction_uuid'])->first();

            if (!$payment) {
                Log::warning('eSewa payment callback: Transaction UUID not found', $validated);
                return response()->json([
                    'message' => 'Payment not found',
                ], 404);
            }

            // Verify signature
            if (!$this->verifyEsewaSignature($validated)) {
                Log::warning('eSewa payment callback: Invalid signature', $validated);
                return response()->json([
                    'message' => 'Invalid signature',
                ], 422);
            }

            if ($validated['status'] !== 'COMPLETE') {
                $payment->update(['status' => 'failed']);
                return response()->json([
                    'message' => 'Payment not completed',
                ], 422);
            }

            // Verify amount matches
            if ((float)$validated['total_amount'] !== (float)$payment->amount) {
                Log::error('eSewa payment callback: Amount mismatch', [
                    'expected' => $payment->amount,
                    'received' => $validated['total_amount'],
                ]);
                return response()->json([
                    'message' => 'Amount mismatch',
                ], 422);
            }

            // Update payment record
            $payment->update([
                'status' => 'completed',
                'gateway_response' => $validated,
                'paid_at' => now(),
            ]);

            // Update order payment status
            $payment->order->update([
                'payment_status' => 'paid',
                'status' => 'confirmed',
            ]);

            Log::info('eSewa payment completed successfully', [
                'payment_id' => $payment->id,
                'order_id' => $payment->order->id,
                'transaction_uuid' => $validated['transaction_uuid'],
            ]);

            return response()->json([
                'message' => 'Payment verified successfully',
                'payment_id' => $payment->id,
            ]);
        } catch (\Throwable $e) {
            Log::error('eSewa payment callback failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Payment verification failed',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Handle eSewa payment failure callback.
     */
    public function handleFailure(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'transaction_uuid' => 'required|string',
            ]);

            $payment = Payment::where('transaction_id', $validated['transaction_uuid'])->first();

            if ($payment) {
                $payment->update([
                    'status' => 'failed',
                    'gateway_response' => $validated,
                ]);

                Log::warning('eSewa payment failed', $validated);
            }

            return response()->json([
                'message' => 'Payment failure recorded',
            ]);
        } catch (\Throwable $e) {
            Log::error('eSewa failure callback error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error processing failure',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Verify eSewa signature.
     */
    private function verifyEsewaSignature(array $data): bool
    {
        try {
            $secret = Setting::get('esewa_secret_key', '');
            if (!$secret) {
                return false;
            }

            // Build signature string: "total_amount=X,transaction_uuid=Y,product_code=Z"
            $signatureData = "total_amount={$data['total_amount']},transaction_uuid={$data['transaction_uuid']},product_code={$data['product_code']}";

            // Generate HMAC-SHA256 signature
            $generatedSignature = base64_encode(
                hash_hmac('sha256', $signatureData, $secret, true)
            );

            // Compare signatures (constant-time comparison)
            return hash_equals($generatedSignature, $data['signature']);
        } catch (\Throwable $e) {
            Log::error('eSewa signature verification error: ' . $e->getMessage());
            return false;
        }
    }
}
