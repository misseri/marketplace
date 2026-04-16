package com.marketplace.cart.model;

import com.marketplace.auth.model.User;
import com.marketplace.product.model.Product;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
        name = "корзина"
)
@Getter
@Setter

public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "пользователь_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "товар_id")
    private Product product;

    @Column(name = "количество")
    private Integer quantity;
}
