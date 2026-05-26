<?php

namespace App\Services\Payment;

use App\Interfaces\Payment\PaymentRepositoryInterface;
use App\Interfaces\Payment\PaymentServiceInterface;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentService implements PaymentServiceInterface
{
    protected $paymentRepository;

    public function __construct(PaymentRepositoryInterface $paymentRepository)
    {
        $this->paymentRepository = $paymentRepository;
    }

    /**
     * Initiate a new payment transaction.
     */
    public function initiatePayment(string $userId, string $orderId, string $gateway): array
    {
        $order = Order::findOrFail($orderId);

        if ($order->user_id !== $userId) {
            abort(403, 'Unauthorized access to this order.');
        }

        if ($order->payment_status === 'paid') {
            throw new \Exception("This order has already been paid.");
        }

        // Validate gateway settings
        $gateway = strtolower($gateway);
        if ($gateway === 'esewa') {
            $esewaActive = Setting::get('esewa_active', '0');
            if ($esewaActive !== '1') {
                throw new \Exception("eSewa payment gateway is currently disabled.");
            }
        } elseif ($gateway === 'paypal') {
            $paypalActive = Setting::get('paypal_active', '0');
            if ($paypalActive !== '1') {
                throw new \Exception("PayPal payment gateway is currently disabled.");
            }
        } else {
            throw new \Exception("Unsupported payment gateway: {$gateway}");
        }

        // Create pending payment record
        $payment = $this->paymentRepository->create([
            'order_id' => $order->id,
            'gateway' => $gateway,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        $responseData = [
            'payment_id' => $payment->id,
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'amount' => $payment->amount,
            'gateway' => $gateway,
        ];

        // Specific gateway configuration
        if ($gateway === 'esewa') {
            $merchantCode = Setting::get('esewa_merchant_code', 'EPAYTEST');
            $secretKey = Setting::get('esewa_secret_key', '8g7h3o91bh14');
            $mode = Setting::get('esewa_mode', 'sandbox');

            // Format total to 2 decimal places as required by eSewa
            $formattedAmount = number_format((float)$payment->amount, 2, '.', '');

            // Signature string format for eSewa EPAY v2:
            // "total_amount=X,transaction_uuid=Y,product_code=Z"
            $signatureString = "total_amount={$formattedAmount},transaction_uuid={$payment->id},product_code={$merchantCode}";
            
            // Calculate HMAC-SHA256 signature and Base64 encode it
            $signature = base64_encode(hash_hmac('sha256', $signatureString, $secretKey, true));

            $actionUrl = ($mode === 'live') 
                ? 'https://epay.esewa.com.np/api/epay/main/v2/form'
                : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

            $responseData['esewa'] = [
                'merchant_code' => $merchantCode,
                'signature' => $signature,
                'mode' => $mode,
                'action_url' => $actionUrl,
                'success_url' => url("/payment-verify?gateway=esewa&status=completed&payment_id={$payment->id}&order_id={$order->id}"),
                'failure_url' => url("/payment-verify?gateway=esewa&status=failed&payment_id={$payment->id}&order_id={$order->id}"),
            ];
        } elseif ($gateway === 'paypal') {
            $clientId = Setting::get('paypal_client_id', '');
            $mode = Setting::get('paypal_mode', 'sandbox');

            $responseData['paypal'] = [
                'client_id' => $clientId,
                'mode' => $mode,
            ];
        }

        return $responseData;
    }

    /**
     * Verify payment status and update order transactional state.
     */
    public function verifyPayment(string $paymentId, string $status, ?string $transactionId, ?array $gatewayResponse): Payment
    {
        $payment = $this->paymentRepository->findById($paymentId);

        if (!$payment) {
            abort(404, 'Payment record not found.');
        }

        if ($payment->status !== 'pending') {
            return $payment; // already processed
        }

        return DB::transaction(function () use ($payment, $status, $transactionId, $gatewayResponse) {
            $status = strtolower($status);

            if ($status === 'completed') {
                $payment->update([
                    'status' => 'completed',
                    'transaction_id' => $transactionId ?? 'TXN-' . strtoupper(Str::random(10)),
                    'gateway_response' => $gatewayResponse,
                    'paid_at' => now(),
                ]);

                // Update Order payment status
                $order = $payment->order;
                if ($order) {
                    $order->update([
                        'payment_status' => 'paid',
                        'status' => 'confirmed',
                    ]);
                }
            } else {
                $payment->update([
                    'status' => 'failed',
                    'gateway_response' => $gatewayResponse,
                ]);
            }

            return $payment->load(['order.user']);
        });
    }

    /**
     * Retrieve details of a specific payment.
     */
    public function getPaymentById(string $userId, string $paymentId, bool $isAdmin = false): Payment
    {
        $payment = $this->paymentRepository->findById($paymentId);

        if (!$payment) {
            abort(404, 'Payment record not found.');
        }

        if (!$isAdmin && $payment->order->user_id !== $userId) {
            abort(403, 'Unauthorized access to this payment.');
        }

        return $payment;
    }

    /**
     * Get all payments associated with a specific customer order.
     */
    public function getOrderPayments(string $userId, string $orderId)
    {
        $order = Order::findOrFail($orderId);

        if ($order->user_id !== $userId) {
            abort(403, 'Unauthorized access to this order.');
        }

        return Payment::with(['order'])->where('order_id', $orderId)->orderBy('created_at', 'desc')->get();
    }

    /**
     * Admin method to list all system payments with filters.
     */
    public function getAllPayments(array $filters)
    {
        return $this->paymentRepository->all($filters);
    }

    /**
     * Admin or system updater.
     */
    public function updatePaymentStatus(string $paymentId, string $status, ?array $gatewayResponse = null): Payment
    {
        $data = ['status' => $status];
        if ($gatewayResponse !== null) {
            $data['gateway_response'] = $gatewayResponse;
        }

        return $this->paymentRepository->update($paymentId, $data);
    }
}
