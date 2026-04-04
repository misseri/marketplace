package com.marketplace.product.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "товары")
@Getter
@Setter
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "продавец_id", nullable = false)
    private Seller seller;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "категории_id", nullable = false)
    private Category category;

    @Column(name = "название", nullable = false)
    private String name;

    @Column(name = "описание", nullable = false)
    private String description;

    @Column(name = "активен", nullable = false)
    private boolean active;

    @OneToOne(mappedBy = "product", fetch = FetchType.LAZY)
    private ProductStock stock;
}
