package com.marketplace.cart.controller;

import com.marketplace.cart.dto.CartItemRequest;
import com.marketplace.cart.dto.CartResponse;
import com.marketplace.cart.service.CartService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public CartResponse getCart(Authentication authentication) {
        Integer userId = requireUserId(authentication);
        return cartService.getCart(userId);
    }

    @PostMapping("/items")
    public CartResponse addItem(@RequestBody CartItemRequest requestBody,
                                Authentication authentication) {
        Integer userId = requireUserId(authentication);
        return cartService.addItem(userId, requestBody);
    }

    @PutMapping("/items/{productId}")
    public CartResponse updateQuantity(@PathVariable Integer productId,
                                       @RequestBody CartItemRequest requestBody,
                                       Authentication authentication) {
        Integer userId = requireUserId(authentication);
        return cartService.updateQuantity(userId, productId, requestBody.quantity());
    }

    @DeleteMapping("/items/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeItem(@PathVariable Integer productId,
                           Authentication authentication) {
        Integer userId = requireUserId(authentication);
        cartService.removeItem(userId, productId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearCart(Authentication authentication) {
        Integer userId = requireUserId(authentication);
        cartService.clearCart(userId);
    }

    private Integer requireUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Integer userId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Требуется авторизация");
        }

        return userId;
    }
}
