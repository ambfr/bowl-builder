package com.asgaj.bowl_builder.bowl;

import java.math.BigDecimal;

public record BowlPriceResponse(BigDecimal subtotal, BigDecimal total, Nutrition nutrition) {
}