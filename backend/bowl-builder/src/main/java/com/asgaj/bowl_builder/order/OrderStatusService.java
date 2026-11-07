package com.asgaj.bowl_builder.order;

import com.asgaj.bowl_builder.ingredient.Ingredient;
import com.asgaj.bowl_builder.ingredient.IngredientRepository;
import com.asgaj.bowl_builder.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class OrderStatusService {

    private final CustomerOrderRepository orders;
    private final IngredientRepository ingredients;
    private final UserRepository users;
    private final OrderService orderService;

    public OrderStatusService(CustomerOrderRepository orders, IngredientRepository ingredients,
                              UserRepository users, OrderService orderService) {
        this.orders = orders;
        this.ingredients = ingredients;
        this.users = users;
        this.orderService = orderService;
    }

    /** Staff/admin: move any order to its next allowed status. */
    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus next) {
        CustomerOrder order = orders.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        move(order, next);
        return orderService.toResponse(orders.save(order));
    }

    /** Customer: cancel their own order, only while it is still PLACED. */
    @Transactional
    public OrderResponse cancelOwn(String email, Long id) {
        Long userId = users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists"))
                .getId();
        CustomerOrder order = orders.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (order.getStatus() != OrderStatus.PLACED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Order can only be cancelled while PLACED (it is " + order.getStatus() + ")");
        }
        move(order, OrderStatus.CANCELLED);
        return orderService.toResponse(orders.save(order));
    }

    /** Staff/admin: all orders, optionally filtered by status. */
    @Transactional(readOnly = true)
    public List<OrderResponse> listAll(OrderStatus status) {
        List<CustomerOrder> found = status == null
                ? orders.findAllByOrderByIdDesc()
                : orders.findByStatusOrderByIdAsc(status);
        return found.stream().map(orderService::toResponse).toList();
    }

    private void move(CustomerOrder order, OrderStatus next) {
        if (!order.getStatus().canMoveTo(next)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot move order from " + order.getStatus() + " to " + next);
        }
        order.setStatus(next);
        if (next == OrderStatus.CANCELLED) {
            restoreStock(order);
        }
    }

    /** Puts one portion of each ingredient back. Runs inside the caller's transaction. */
    private void restoreStock(CustomerOrder order) {
        List<Long> ids = order.getItems().stream().map(OrderItem::getIngredientId).toList();
        List<Ingredient> found = ingredients.findAllById(ids);
        for (Ingredient i : found) {
            i.setStock(i.getStock() + 1);
        }
        ingredients.saveAll(found);
    }
}