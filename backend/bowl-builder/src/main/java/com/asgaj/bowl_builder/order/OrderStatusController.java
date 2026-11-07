package com.asgaj.bowl_builder.order;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class OrderStatusController {

    private final OrderStatusService service;

    public OrderStatusController(OrderStatusService service) {
        this.service = service;
    }

    @PatchMapping("/api/orders/{id}/status")
    public OrderResponse updateStatus(@PathVariable Long id,
                                      @Valid @RequestBody StatusUpdateRequest request) {
        return service.updateStatus(id, request.status());
    }

    @PostMapping("/api/orders/{id}/cancel")
    public OrderResponse cancel(Authentication auth, @PathVariable Long id) {
        return service.cancelOwn(auth.getName(), id);
    }

    @GetMapping("/api/staff/orders")
    public List<OrderResponse> staffOrders(@RequestParam(required = false) OrderStatus status) {
        return service.listAll(status);
    }
}