package com.asgaj.bowl_builder.ingredient;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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

    @PatchMapping("/{id}/stock")
    public Ingredient setStock(@PathVariable Long id, @Valid @RequestBody StockUpdateRequest request) {
        Ingredient ingredient = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ingredient not found"));
        ingredient.setStock(request.stock());
        return repository.save(ingredient);
    }
}