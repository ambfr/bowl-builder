package com.asgaj.bowl_builder.order;

import com.asgaj.bowl_builder.bowl.BowlPriceResponse;
import com.asgaj.bowl_builder.bowl.BowlRequest;
import com.asgaj.bowl_builder.bowl.Nutrition;
import com.asgaj.bowl_builder.bowl.PricingService;
import com.asgaj.bowl_builder.ingredient.Ingredient;
import com.asgaj.bowl_builder.ingredient.IngredientRepository;
import com.asgaj.bowl_builder.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final CustomerOrderRepository orders;
    private final IngredientRepository ingredients;
    private final UserRepository users;
    private final PricingService pricingService;

    public OrderService(CustomerOrderRepository orders, IngredientRepository ingredients,
                        UserRepository users, PricingService pricingService) {
        this.orders = orders;
        this.ingredients = ingredients;
        this.users = users;
        this.pricingService = pricingService;
    }

    @Transactional
    public OrderResponse place(String email, BowlRequest req) {
        Long userId = userId(email);

        // Validates ids, categories and promo code (throws 400), and computes price + nutrition.
        BowlPriceResponse price = pricingService.price(req);

        List<Ingredient> chosen = new ArrayList<>();
        chosen.add(ingredients.findById(req.baseId()).orElseThrow());
        if (req.toppingIds() != null && !req.toppingIds().isEmpty()) {
            chosen.addAll(ingredients.findAllById(req.toppingIds()));
        }
        if (req.drizzleIds() != null && !req.drizzleIds().isEmpty()) {
            chosen.addAll(ingredients.findAllById(req.drizzleIds()));
        }

        CustomerOrder order = new CustomerOrder();
        order.setUserId(userId);
        order.setSize(req.size());
        String promo = req.promoCode() == null ? "" : req.promoCode().trim().toUpperCase();
        order.setPromoCode(promo.isEmpty() ? null : promo);
        order.setSubtotal(price.subtotal());
        order.setTotal(price.total());
        order.setCalories(price.nutrition().calories());
        order.setProteinG(price.nutrition().proteinG());
        order.setSugarG(price.nutrition().sugarG());
        for (Ingredient i : chosen) {
            order.getItems().add(new OrderItem(i.getId(), i.getName(), i.getCategory(), i.getPrice()));
        }
        return toResponse(orders.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> list(String email) {
        return orders.findByUserIdOrderByIdDesc(userId(email)).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse get(String email, Long id) {
        // Looks up by id AND owner, so someone else's order looks like it does not exist.
        return orders.findByIdAndUserId(id, userId(email))
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private Long userId(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists"))
                .getId();
    }

    OrderResponse toResponse(CustomerOrder o) {
        List<OrderItemResponse> items = o.getItems().stream()
                .map(i -> new OrderItemResponse(i.getIngredientId(), i.getName(), i.getCategory(), i.getUnitPrice()))
                .toList();
        return new OrderResponse(o.getId(), o.getStatus(), o.getSize(), o.getPromoCode(),
                o.getSubtotal(), o.getTotal(),
                new Nutrition(o.getCalories(), o.getProteinG(), o.getSugarG()),
                items, o.getCreatedAt());
    }
}