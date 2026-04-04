package com.marketplace.product.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "цены_товаров")
@Getter
@Setter
public class ProductPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "товар_id", nullable = false)
    private Product product;

    @Column(name = "цена", nullable = false)
    private BigDecimal price;

    @Column(name = "дата_начала", nullable = false)
    private LocalDate startDate;

    @Column(name = "дата_окончания")
    private LocalDate endDate;
}
