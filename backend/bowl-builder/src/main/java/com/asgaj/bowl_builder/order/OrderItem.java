package com.asgaj.bowl_builder.order;

import com.asgaj.bowl_builder.ingredient.Category;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/** A snapshot of one ingredient as it was when the order was placed. */
@Entity
@Table(name = "order_item")
@Getter
@Setter
@NoArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long ingredientId;

    private String name;

    @Enumerated(EnumType.STRING)
    private Category category;

    private BigDecimal unitPrice;

    public OrderItem(Long ingredientId, String name, Category category, BigDecimal unitPrice) {
        this.ingredientId = ingredientId;
        this.name = name;
        this.category = category;
        this.unitPrice = unitPrice;
    }
}