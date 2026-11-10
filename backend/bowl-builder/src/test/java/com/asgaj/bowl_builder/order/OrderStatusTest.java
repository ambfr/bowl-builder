package com.asgaj.bowl_builder.order;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class OrderStatusTest {

    private static final Set<String> ALLOWED = Set.of(
            "PLACED>PREPARING",
            "PLACED>CANCELLED",
            "PREPARING>READY",
            "PREPARING>CANCELLED",
            "READY>PICKED_UP");

    @Test
    void onlyTheFiveLegalTransitionsAreAllowed() {
        for (OrderStatus from : OrderStatus.values()) {
            for (OrderStatus to : OrderStatus.values()) {
                boolean expected = ALLOWED.contains(from + ">" + to);
                assertThat(from.canMoveTo(to))
                        .as(from + " -> " + to)
                        .isEqualTo(expected);
            }
        }
    }

    @Test
    void finishedOrdersCannotMoveAnywhere() {
        for (OrderStatus to : OrderStatus.values()) {
            assertThat(OrderStatus.PICKED_UP.canMoveTo(to)).isFalse();
            assertThat(OrderStatus.CANCELLED.canMoveTo(to)).isFalse();
        }
    }

    @Test
    void stepsCannotBeSkipped() {
        assertThat(OrderStatus.PLACED.canMoveTo(OrderStatus.READY)).isFalse();
        assertThat(OrderStatus.PLACED.canMoveTo(OrderStatus.PICKED_UP)).isFalse();
        assertThat(OrderStatus.PREPARING.canMoveTo(OrderStatus.PICKED_UP)).isFalse();
    }

    @Test
    void readyOrdersCannotBeCancelled() {
        assertThat(OrderStatus.READY.canMoveTo(OrderStatus.CANCELLED)).isFalse();
    }
}