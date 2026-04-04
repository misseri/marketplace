package com.marketplace.product.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "продавцы")
@Getter
@Setter
public class Seller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "название_магазина", nullable = false)
    private String storeName;

    @Column(name = "рейтинг", nullable = false)
    private BigDecimal rating;
}
