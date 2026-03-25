package com.marketplace.product.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "отзывы_товаров")
@Getter
@Setter
public class ProductReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "товар_id", nullable = false)
    private Product product;

    @Column(name = "оценка", nullable = false)
    private BigDecimal rating;

    @Column(name = "комментарий", nullable = false)
    private String comment;

    @Column(name = "дата_отзыва", nullable = false)
    private LocalDate reviewDate;
}
