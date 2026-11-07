package com.asgaj.bowl_builder.order;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class ReorderController {

    private final ReorderService service;

    public ReorderController(ReorderService service) {
        this.service = service;
    }

    @PostMapping("/api/orders/{id}/reorder")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse reorder(Authentication auth, @PathVariable Long id) {
        return service.reorder(auth.getName(), id);
    }
}