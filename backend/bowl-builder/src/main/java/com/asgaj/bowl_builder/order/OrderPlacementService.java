package com.asgaj.bowl_builder.order;

import com.asgaj.bowl_builder.bowl.BowlRequest;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.concurrent.ThreadLocalRandom;

/**
 * Deliberately NOT @Transactional: each attempt runs in its own transaction inside
 * OrderService.place(), and a version conflict is only detected when that transaction commits.
 * On a conflict we start over, re-read the fresh stock, and either succeed or get a clean 409.
 */
@Service
public class OrderPlacementService {

    private static final int MAX_ATTEMPTS = 100;

    private final OrderService orderService;

    public OrderPlacementService(OrderService orderService) {
        this.orderService = orderService;
    }

    public OrderResponse place(String email, BowlRequest request) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                return orderService.place(email, request);
            } catch (ConcurrencyFailureException e) {
                // Includes optimistic-lock failures. Short random pause so losers do not collide again.
                try {
                    Thread.sleep(ThreadLocalRandom.current().nextInt(5, 30));
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "The kitchen is very busy, please try again");
    }
}