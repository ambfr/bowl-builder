package com.asgaj.bowl_builder.realtime;

import com.asgaj.bowl_builder.order.CustomerOrderRepository;
import com.asgaj.bowl_builder.order.OrderResponse;
import com.asgaj.bowl_builder.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/** Pushes an order to the kitchen board and to the customer who owns it. Never throws. */
@Service
public class OrderBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(OrderBroadcaster.class);

    private final SimpMessagingTemplate messaging;
    private final CustomerOrderRepository orders;
    private final UserRepository users;

    public OrderBroadcaster(SimpMessagingTemplate messaging, CustomerOrderRepository orders, UserRepository users) {
        this.messaging = messaging;
        this.orders = orders;
        this.users = users;
    }

    public void publish(OrderResponse order) {
        try {
            messaging.convertAndSend("/topic/kitchen", order);
            orders.findById(order.id())
                    .flatMap(o -> users.findById(o.getUserId()))
                    .ifPresent(u -> messaging.convertAndSendToUser(u.getEmail(), "/queue/orders", order));
        } catch (Exception e) {
            // A failed push must never fail the order request itself.
            log.warn("Could not broadcast order {}: {}", order.id(), e.toString());
        }
    }
}