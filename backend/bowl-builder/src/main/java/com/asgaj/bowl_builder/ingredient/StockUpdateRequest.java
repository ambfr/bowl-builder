package com.asgaj.bowl_builder.ingredient;

import jakarta.validation.constraints.Min;

public record StockUpdateRequest(@Min(0) int stock) {
}