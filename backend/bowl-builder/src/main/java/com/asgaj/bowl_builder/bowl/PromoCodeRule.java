package com.asgaj.bowl_builder.bowl;

import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@Component
@Order(2)
public class PromoCodeRule implements PricingRule {

    @Override
    public BigDecimal apply(BigDecimal price, BowlRequest request) {
        String code = request.promoCode();
        if (code == null || code.isBlank()) return price;

        return switch (code.trim().toUpperCase()) {
            case "ACAI10" -> price.multiply(new BigDecimal("0.90"));
            case "FIRST50" -> price.subtract(new BigDecimal("50")).max(BigDecimal.ZERO);
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid promo code: " + code);
        };
    }
}