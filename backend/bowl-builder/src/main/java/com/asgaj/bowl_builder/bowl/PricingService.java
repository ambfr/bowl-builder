package com.asgaj.bowl_builder.bowl;

import com.asgaj.bowl_builder.ingredient.Category;
import com.asgaj.bowl_builder.ingredient.Ingredient;
import com.asgaj.bowl_builder.ingredient.IngredientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class PricingService {

    private final IngredientRepository ingredientRepository;
    private final List<PricingRule> rules;

    public PricingService(IngredientRepository ingredientRepository, List<PricingRule> rules) {
        this.ingredientRepository = ingredientRepository;
        this.rules = rules;
    }

    public BowlPriceResponse price(BowlRequest request) {
        Ingredient base = ingredientRepository.findById(request.baseId())
                .orElseThrow(() -> badRequest("Base not found: " + request.baseId()));
        if (base.getCategory() != Category.BASE) {
            throw badRequest(base.getName() + " is not a base");
        }

        List<Ingredient> toppings = load(request.toppingIds(), Category.TOPPING);
        List<Ingredient> drizzles = load(request.drizzleIds(), Category.DRIZZLE);

        BigDecimal subtotal = base.getPrice();
        for (Ingredient i : toppings) subtotal = subtotal.add(i.getPrice());
        for (Ingredient i : drizzles) subtotal = subtotal.add(i.getPrice());

        BigDecimal total = subtotal;
        for (PricingRule rule : rules) {
            total = rule.apply(total, request);
        }

        return new BowlPriceResponse(
                subtotal.setScale(2, RoundingMode.HALF_UP),
                total.setScale(2, RoundingMode.HALF_UP));
    }

    private List<Ingredient> load(List<Long> ids, Category expected) {
        if (ids == null || ids.isEmpty()) return List.of();
        List<Ingredient> found = ingredientRepository.findAllById(ids);
        if (found.size() != ids.stream().distinct().count()) {
            throw badRequest("One or more " + expected + " ids not found");
        }
        for (Ingredient i : found) {
            if (i.getCategory() != expected) {
                throw badRequest(i.getName() + " is not a " + expected);
            }
        }
        return found;
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}