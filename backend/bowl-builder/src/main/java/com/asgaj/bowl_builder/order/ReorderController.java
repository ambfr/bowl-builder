package com.asgaj.bowl_builder.order;

import com.asgaj.bowl_builder.realtime.OrderBroadcaster;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class ReorderController {

    private final ReorderService service;
    private final OrderBroadcaster broadcaster;

    public ReorderController(ReorderService service, OrderBroadcaster broadcaster) {
        this.service = service;
        this.broadcaster = broadcaster;
    }

    @PostMapping("/api/orders/{id}/reorder")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse reorder(Authentication auth, @PathVariable Long id) {
        OrderResponse placed = service.reorder(auth.getName(), id);
        broadcaster.publish(placed);
        return placed;
    }
}