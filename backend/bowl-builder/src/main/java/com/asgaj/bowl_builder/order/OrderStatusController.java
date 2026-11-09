package com.asgaj.bowl_builder.order;

import com.asgaj.bowl_builder.realtime.OrderBroadcaster;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class OrderStatusController {

    private final OrderStatusService service;
    private final OrderBroadcaster broadcaster;

    public OrderStatusController(OrderStatusService service, OrderBroadcaster broadcaster) {
        this.service = service;
        this.broadcaster = broadcaster;
    }

    @PatchMapping("/api/orders/{id}/status")
    public OrderResponse updateStatus(@PathVariable Long id,
                                      @Valid @RequestBody StatusUpdateRequest request) {
        OrderResponse updated = service.updateStatus(id, request.status());
        broadcaster.publish(updated);
        return updated;
    }

    @PostMapping("/api/orders/{id}/cancel")
    public OrderResponse cancel(Authentication auth, @PathVariable Long id) {
        OrderResponse cancelled = service.cancelOwn(auth.getName(), id);
        broadcaster.publish(cancelled);
        return cancelled;
    }

    @GetMapping("/api/staff/orders")
    public List<OrderResponse> staffOrders(@RequestParam(required = false) OrderStatus status) {
        return service.listAll(status);
    }
}