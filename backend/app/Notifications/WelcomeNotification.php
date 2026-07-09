<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeNotification extends Notification
{
    use Queueable;

    protected $user;

    /**
     * Create a new notification instance.
     */
    public function __construct($user)
    {
        $this->user = $user;
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
        $isWholesaler = ($this->user->role === 'wholesaler' || $this->user->role === 'wholeseller');
        $loginUrl = config('app.frontend_url') . '/login';

        $message = (new MailMessage)
            ->subject('Welcome to B2B Commerce!')
            ->greeting('Hello ' . $this->user->name . ',')
            ->line('Thank you for registering an account on our B2B Commerce platform.');

        if ($isWholesaler) {
            $message->line('Since you registered as a wholesaler, your account is currently pending approval by our admin team.')
                ->line('We will notify you by email as soon as your account status is updated.');
        } else {
            $message->line('Your account is active. You can now log in and start shopping.')
                ->action('Go to Login', $loginUrl);
        }

        return $message;
    }
}
