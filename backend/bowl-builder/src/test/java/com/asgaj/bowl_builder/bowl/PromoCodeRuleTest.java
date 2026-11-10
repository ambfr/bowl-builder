package com.asgaj.bowl_builder.bowl;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PromoCodeRuleTest {

    private final PromoCodeRule rule = new PromoCodeRule();

    private static BowlRequest withCode(String code) {
        return new BowlRequest(1L, List.of(), List.of(), Size.MEDIUM, code);
    }

    @Test
    void acai10TakesTenPercentOff() {
        assertThat(rule.apply(new BigDecimal("200.00"), withCode("ACAI10")))
                .isEqualByComparingTo("180.00");
    }

    @Test
    void first50TakesFiftyRupeesOff() {
        assertThat(rule.apply(new BigDecimal("200.00"), withCode("FIRST50")))
                .isEqualByComparingTo("150.00");
    }

    @Test
    void flatDiscountNeverGoesBelowZero() {
        assertThat(rule.apply(new BigDecimal("30.00"), withCode("FIRST50")))
                .isEqualByComparingTo("0");
    }

    @Test
    void codesIgnoreCaseAndSurroundingSpaces() {
        assertThat(rule.apply(new BigDecimal("200.00"), withCode("  acai10 ")))
                .isEqualByComparingTo("180.00");
    }

    @Test
    void missingOrBlankCodeLeavesThePriceUnchanged() {
        assertThat(rule.apply(new BigDecimal("200.00"), withCode(null))).isEqualByComparingTo("200.00");
        assertThat(rule.apply(new BigDecimal("200.00"), withCode("   "))).isEqualByComparingTo("200.00");
    }

    @Test
    void unknownCodeIsRejectedWith400() {
        assertThatThrownBy(() -> rule.apply(new BigDecimal("200.00"), withCode("FAKE")))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode().value()).isEqualTo(400))
                .hasMessageContaining("Invalid promo code");
    }
}