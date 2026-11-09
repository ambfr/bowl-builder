package com.asgaj.bowl_builder.order;

import com.asgaj.bowl_builder.bowl.BowlRequest;
import com.asgaj.bowl_builder.realtime.OrderBroadcaster;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService service;
    private final OrderPlacementService placement;
    private final OrderBroadcaster broadcaster;

    public OrderController(OrderService service, OrderPlacementService placement, OrderBroadcaster broadcaster) {
        this.service = service;
        this.placement = placement;
        this.broadcaster = broadcaster;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse place(Authentication auth, @Valid @RequestBody BowlRequest request) {
        OrderResponse placed = placement.place(auth.getName(), request);
        broadcaster.publish(placed); // the transaction has already committed here
        return placed;
    }

    @GetMapping
    public List<OrderResponse> list(Authentication auth) {
        return service.list(auth.getName());
    }

    @GetMapping("/{id}")
    public OrderResponse get(Authentication auth, @PathVariable Long id) {
        return service.get(auth.getName(), id);
    }
}