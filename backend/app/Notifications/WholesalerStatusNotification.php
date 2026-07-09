<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WholesalerStatusNotification extends Notification
{
    use Queueable;

    protected $status;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $status)
    {
        $this->status = $status; // 'approved' or 'rejected'
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $loginUrl = config('app.frontend_url') . '/login';
        $message = new MailMessage;

        if ($this->status === 'approved') {
            $message->subject('Wholesaler Account Approved!')
                ->greeting('Hello ' . $notifiable->name . ',')
                ->line('We are pleased to inform you that your wholesaler account application has been approved by our admin team!')
                ->line('You can now log in to access wholesale prices, bulk order discounts, and exclusive wholesaler offers.')
                ->action('Log In to Your Account', $loginUrl);
        } else {
            $message->subject('Wholesaler Account Status Update')
                ->greeting('Hello ' . $notifiable->name . ',')
                ->line('We regret to inform you that your wholesaler account application has been rejected at this time.')
                ->line('If you have any questions or believe this was an error, please contact our support team.');
        }

        return $message;
    }
}
