package com.asgaj.bowl_builder.ingredient;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingredients")
public class IngredientController {

    private final IngredientRepository repository;

    public IngredientController(IngredientRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Ingredient> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Ingredient create(@RequestBody Ingredient ingredient) {
        return repository.save(ingredient);
    }
}