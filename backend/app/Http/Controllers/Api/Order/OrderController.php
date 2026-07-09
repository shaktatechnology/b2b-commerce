<?php

namespace App\Http\Controllers\Api\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Order\CheckoutRequest;
use App\Http\Requests\Api\Order\AdminCreateOrderRequest;
use App\Http\Requests\Api\Order\UpdateOrderAdminRequest;
use App\Interfaces\Order\OrderServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    protected $orderService;

    public function __construct(OrderServiceInterface $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * Display a listing of the customer's orders.
     */
    public function index(Request $request): JsonResponse
    {
        $orders = $this->orderService->getUserOrders($request->user()->id);

        return response()->json([
            'message' => 'Orders retrieved successfully',
            'data' => $orders,
        ]);
    }

    /**
     * Display the specified customer's order.
     */
    public function show(string $id, Request $request): JsonResponse
    {
        $order = $this->orderService->getOrderById($request->user()->id, $id, false);

        return response()->json([
            'message' => 'Order retrieved successfully',
            'data' => $order,
        ]);
    }

    /**
     * Create a new order by checking out the customer's cart.
     */
    public function store(CheckoutRequest $request): JsonResponse
    {
        try {
            $order = $this->orderService->createOrderFromCart(
                $request->user()->id,
                $request->input('shipping_address', []),
                $request->input('notes'),
                $request->input('address_id'),
                $request->input('currency', 'NPR'),
                $request->input('coupon_code')
            );

            return response()->json([
                'message' => 'Order placed successfully',
                'data' => $order,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Display a listing of all orders for admin.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'payment_status', 'order_number', 'user_id', 'per_page', 'from', 'to', 'customer', 'user_type']);
        $orders = $this->orderService->getAllOrders($filters);

        return response()->json([
            'message' => 'All orders retrieved successfully',
            'data' => $orders,
        ]);
    }

    /**
     * Display any order for admin.
     */
    public function adminShow(string $id, Request $request): JsonResponse
    {
        $order = $this->orderService->getOrderById($request->user()->id, $id, true);

        return response()->json([
            'message' => 'Order retrieved successfully',
            'data' => $order,
        ]);
    }

    /**
     * Admin: create an order directly (with user + item selection, no cart).
     */
    public function adminStore(AdminCreateOrderRequest $request): JsonResponse
    {
        try {
            $order = $this->orderService->createOrderDirect(
                $request->user()->id,
                $request->input('user_id'),
                $request->input('items'),
                $request->input('shipping_address'),
                $request->input('notes'),
                $request->input('address_id'),
                $request->input('currency', 'NPR')
            );

            return response()->json([
                'message' => 'Order created successfully',
                'data'    => $order,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Update the order status and/or payment status for admin.
     */
    public function adminUpdate(UpdateOrderAdminRequest $request, string $id): JsonResponse
    {
        $order = $this->orderService->updateOrderStatus(
            $id,
            $request->input('status'),
            $request->input('payment_status')
        );

        return response()->json([
            'message' => 'Order updated successfully',
            'data'    => $order,
        ]);
    }
}
