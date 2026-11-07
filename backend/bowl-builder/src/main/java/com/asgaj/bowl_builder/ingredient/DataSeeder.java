package com.asgaj.bowl_builder.ingredient;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataSeeder implements CommandLineRunner {

    private final IngredientRepository repository;

    public DataSeeder(IngredientRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) return;

        repository.save(new Ingredient("Acai", Category.BASE, new BigDecimal("250.00"), 140, 2.0, 8.0, 100));
        repository.save(new Ingredient("Pitaya", Category.BASE, new BigDecimal("280.00"), 120, 2.0, 9.0, 100));
        repository.save(new Ingredient("Banana", Category.TOPPING, new BigDecimal("30.00"), 105, 1.3, 14.0, 100));
        repository.save(new Ingredient("Strawberry", Category.TOPPING, new BigDecimal("50.00"), 30, 0.6, 5.0, 100));
        repository.save(new Ingredient("Granola", Category.TOPPING, new BigDecimal("40.00"), 120, 3.0, 5.0, 100));
        repository.save(new Ingredient("Honey", Category.DRIZZLE, new BigDecimal("25.00"), 60, 0.0, 17.0, 100));
        repository.save(new Ingredient("Peanut Butter", Category.DRIZZLE, new BigDecimal("35.00"), 95, 4.0, 1.5, 100));
    }
}