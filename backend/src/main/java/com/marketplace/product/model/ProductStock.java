package com.marketplace.product.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "остатки_товаров")
@Getter
@Setter
public class ProductStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "товар_id", nullable = false)
    private Product product;

    @Column(name = "количество", nullable = false)
    private Integer quantity;
}
