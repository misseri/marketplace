package com.marketplace.cart.controller;

import com.marketplace.auth.service.JwtService;
import com.marketplace.cart.dto.CartItemRequest;
import com.marketplace.cart.dto.CartResponse;
import com.marketplace.cart.service.CartService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;
    private final JwtService jwtService;

    public CartController(CartService cartService,
                          JwtService jwtService) {
        this.cartService = cartService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public CartResponse getCart(HttpServletRequest request) {
        Integer userId = extractUserId(request);
        return cartService.getCart(userId);
    }

        @PostMapping("/items")
        public CartResponse addItem(@RequestBody CartItemRequest requestBody,
                                    HttpServletRequest request) {
            Integer userId = extractUserId(request);
            return cartService.addItem(userId, requestBody);
    }

    @PutMapping("/items/{productId}")
    public CartResponse updateQuantity(@PathVariable Integer productId,
                                       @RequestBody CartItemRequest requestBody,
                                       HttpServletRequest request) {
        Integer userId = extractUserId(request);
        return cartService.updateQuantity(userId, productId, requestBody.quantity());
    }

    @DeleteMapping("/items/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeItem(@PathVariable Integer productId,
                           HttpServletRequest request) {
        Integer userId = extractUserId(request);
        cartService.removeItem(userId, productId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearCart(HttpServletRequest request) {
        Integer userId = extractUserId(request);
        cartService.clearCart(userId);
    }

    private Integer extractUserId(HttpServletRequest request) {
        if (request.getCookies() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Требуется авторизация");
        }

        for (Cookie cookie : request.getCookies()) {
            if ("access_token".equals(cookie.getName())) {
                return jwtService.extractUserId(cookie.getValue());
            }
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Требуется авторизация");
    }
}
