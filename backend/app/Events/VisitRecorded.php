<?php

namespace App\Events;

use App\Models\Visit;
use App\Models\Customer;
use App\Models\Tenant;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VisitRecorded
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $visit;
    public $customer;
    public $tenant;
    public $device;
    public $pointsToAdd;
    public $isElite;
    public $isPro;

    /**
     * Create a new event instance.
     */
    public function __construct(Visit $visit, Customer $customer, Tenant $tenant, $device, int $pointsToAdd, bool $isElite, bool $isPro)
    {
        $this->visit = $visit;
        $this->customer = $customer;
        $this->tenant = $tenant;
        $this->device = $device;
        $this->pointsToAdd = $pointsToAdd;
        $this->isElite = $isElite;
        $this->isPro = $isPro;
    }
}
