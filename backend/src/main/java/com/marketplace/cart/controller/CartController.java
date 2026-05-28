package com.marketplace.cart.controller;

import com.marketplace.auth.service.CurrentUserService;
import com.marketplace.cart.dto.CartItemRequest;
import com.marketplace.cart.dto.CartResponse;
import com.marketplace.cart.service.CartService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;
    private final CurrentUserService currentUserService;

    public CartController(CartService cartService, CurrentUserService currentUserService) {
        this.cartService = cartService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public CartResponse getCart() {
        return cartService.getCart(currentUserService.getCurrentUserId());
    }

    @PostMapping("/items")
    public CartResponse addItem(@RequestBody CartItemRequest requestBody) {
        return cartService.addItem(currentUserService.getCurrentUserId(), requestBody);
    }

    @PutMapping("/items/{productId}")
    public CartResponse updateQuantity(@PathVariable Integer productId,
                                       @RequestBody CartItemRequest requestBody) {
        return cartService.updateQuantity(
                currentUserService.getCurrentUserId(),
                productId,
                requestBody.quantity()
        );
    }

    @DeleteMapping("/items/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeItem(@PathVariable Integer productId) {
        cartService.removeItem(currentUserService.getCurrentUserId(), productId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearCart() {
        cartService.clearCart(currentUserService.getCurrentUserId());
    }
}
