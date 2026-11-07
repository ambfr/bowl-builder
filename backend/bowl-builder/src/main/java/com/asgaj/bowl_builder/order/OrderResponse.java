package com.asgaj.bowl_builder.order;

import com.asgaj.bowl_builder.bowl.Nutrition;
import com.asgaj.bowl_builder.bowl.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        OrderStatus status,
        Size size,
        String promoCode,
        BigDecimal subtotal,
        BigDecimal total,
        Nutrition nutrition,
        List<OrderItemResponse> items,
        Instant createdAt
) {
}