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
    public function verify(VerifyPaymentRequest $request): JsonResponse
    {
        try {
            $payment = $this->paymentService->verifyPayment(
                $request->input('payment_id'),
                $request->input('status'),
                $request->input('transaction_id'),
                $request->input('gateway_response')
            );

            return response()->json([
                'message' => 'Payment status updated successfully',
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

        return response()->json([
            'message' => 'Payment retrieved successfully',
            'data' => $payment,
        ]);
    }

    /**
     * Display a listing of all payments for admin.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $filters = $request->only(['order_id', 'gateway', 'status', 'per_page']);
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
