package com.asgaj.bowl_builder.order;

import com.asgaj.bowl_builder.bowl.BowlRequest;
import com.asgaj.bowl_builder.ingredient.Category;
import com.asgaj.bowl_builder.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/** Not @Transactional on purpose, so the retry in OrderPlacementService can start fresh transactions. */
@Service
public class ReorderService {

    private final CustomerOrderRepository orders;
    private final UserRepository users;
    private final OrderPlacementService placement;

    public ReorderService(CustomerOrderRepository orders, UserRepository users,
                          OrderPlacementService placement) {
        this.orders = orders;
        this.users = users;
        this.placement = placement;
    }

    public OrderResponse reorder(String email, Long id) {
        Long userId = users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists"))
                .getId();
        CustomerOrder old = orders.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        Long baseId = old.getItems().stream()
                .filter(i -> i.getCategory() == Category.BASE)
                .map(OrderItem::getIngredientId)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Order has no base to reorder"));
        List<Long> toppings = idsOf(old, Category.TOPPING);
        List<Long> drizzles = idsOf(old, Category.DRIZZLE);

        return placement.place(email, new BowlRequest(baseId, toppings, drizzles, old.getSize(), null));
    }

    private List<Long> idsOf(CustomerOrder order, Category category) {
        return order.getItems().stream()
                .filter(i -> i.getCategory() == category)
                .map(OrderItem::getIngredientId)
                .toList();
    }
}