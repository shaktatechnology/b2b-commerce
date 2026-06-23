<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Payment\InitiatePaymentRequest;
use App\Http\Requests\Api\Payment\VerifyPaymentRequest;
use App\Interfaces\Payment\PaymentServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    protected $paymentService;

    public function __construct(PaymentServiceInterface $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Initiate a new payment transaction.
     */
    public function initiate(InitiatePaymentRequest $request): JsonResponse
    {
        try {
            $paymentData = $this->paymentService->initiatePayment(
                $request->user()->id,
                $request->input('order_id'),
                $request->input('gateway')
            );

            return response()->json([
                'message' => 'Payment initiated successfully',
                'data' => $paymentData,
            ], 201);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpExceptionInterface $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Verify payment status and record gateway response.
     */
    public function verify(Request $request): JsonResponse
    {
        try {
            $status = $request->input('status');
            $paymentId = $request->input('payment_id');

            if (!$paymentId || !$status) {
                return response()->json([
                    'message' => 'Missing required verification parameters',
                ], 422);
            }

            // Get the payment record
            $payment = \App\Models\Payment::findOrFail($paymentId);

            // Verify user owns this payment's order
            if ($payment->order->user_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'Unauthorized access to this payment',
                ], 403);
            }

            if (strtolower($payment->gateway) === 'cod') {
                return response()->json([
                    'message' => 'Cash on Delivery payments do not require external verification.',
                ], 422);
            }

            $payment = $this->paymentService->verifyPayment(
                $paymentId,
                $status,
                $request->input('transaction_id'),
                $request->input('gateway_response')
            );

            return response()->json([
                'message' => 'Payment verified successfully',
                'data' => $payment,
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpExceptionInterface $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Display a specific payment for customer.
     */
    public function show(string $id, Request $request): JsonResponse
    {
        $payment = $this->paymentService->getPaymentById($request->user()->id, $id, false);

        // Build response matching initiate payment's structure, including active gateway settings
        $gateway = strtolower($payment->gateway);
        $data = [
            'payment_id' => $payment->id,
            'order_id' => $payment->order_id,
            'order_number' => $payment->order ? $payment->order->order_number : null,
            'amount' => $payment->amount,
            'gateway' => $gateway,
            'status' => $payment->status,
        ];

        if ($payment->status === 'pending') {
            if ($gateway === 'esewa') {
                $merchantCode = \App\Models\Setting::get('esewa_merchant_code', 'EPAYTEST');
                $secretKey = \App\Models\Setting::get('esewa_secret_key', '8g7h3o91bh14');
                $mode = \App\Models\Setting::get('esewa_mode', 'sandbox');
                $formattedAmount = number_format((float)$payment->amount, 2, '.', '');
                $signatureString = "total_amount={$formattedAmount},transaction_uuid={$payment->id},product_code={$merchantCode}";
                $signature = base64_encode(hash_hmac('sha256', $signatureString, $secretKey, true));
                $actionUrl = ($mode === 'live') 
                    ? 'https://epay.esewa.com.np/api/epay/main/v2/form'
                    : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

                $data['esewa'] = [
                    'merchant_code' => $merchantCode,
                    'signature' => $signature,
                    'mode' => $mode,
                    'action_url' => $actionUrl,
                    'success_url' => url("/payment-verify?gateway=esewa&status=completed&payment_id={$payment->id}&order_id={$payment->order_id}"),
                    'failure_url' => url("/payment-verify?gateway=esewa&status=failed&payment_id={$payment->id}&order_id={$payment->order_id}"),
                ];
            } elseif ($gateway === 'paypal') {
                $data['paypal'] = [
                    'client_id' => \App\Models\Setting::get('paypal_client_id', ''),
                    'mode' => \App\Models\Setting::get('paypal_mode', 'sandbox'),
                ];
            } elseif ($gateway === 'cod') {
                $data['cod'] = [
                    'message' => 'Cash on Delivery selected. Payment will be collected when the order is delivered.',
                    'payment_status' => 'pending',
                ];
            }
        }

        return response()->json([
            'message' => 'Payment retrieved successfully',
            'data' => $data,
        ]);
    }

    /**
     * Display a listing of all payments for admin.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $filters = $request->only(['order_id', 'gateway', 'status', 'per_page', 'customer', 'from', 'to']);
        $payments = $this->paymentService->getAllPayments($filters);

        return response()->json([
            'message' => 'All payments retrieved successfully',
            'data' => $payments,
        ]);
    }

    /**
     * Display any specific payment for admin.
     */
    public function adminShow(string $id, Request $request): JsonResponse
    {
        $payment = $this->paymentService->getPaymentById($request->user()->id, $id, true);

        return response()->json([
            'message' => 'Payment retrieved successfully',
            'data' => $payment,
        ]);
    }
}
