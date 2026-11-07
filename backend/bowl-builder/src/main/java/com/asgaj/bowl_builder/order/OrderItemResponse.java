package com.asgaj.bowl_builder.order;

import com.asgaj.bowl_builder.ingredient.Category;

import java.math.BigDecimal;

public record OrderItemResponse(Long ingredientId, String name, Category category, BigDecimal unitPrice) {
}