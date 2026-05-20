<?php

namespace App\Interfaces\Payment;

use App\Models\Payment;

interface PaymentServiceInterface
{
    public function initiatePayment(string $userId, string $orderId, string $gateway): array;
    public function verifyPayment(string $paymentId, string $status, ?string $transactionId, ?array $gatewayResponse): Payment;
    public function getPaymentById(string $userId, string $paymentId, bool $isAdmin = false): Payment;
    public function getOrderPayments(string $userId, string $orderId);
    public function getAllPayments(array $filters);
    public function updatePaymentStatus(string $paymentId, string $status, ?array $gatewayResponse = null): Payment;
}
