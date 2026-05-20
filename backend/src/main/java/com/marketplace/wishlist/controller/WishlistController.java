package com.marketplace.wishlist.controller;

import com.marketplace.auth.service.CurrentUserService;
import com.marketplace.wishlist.dto.WishlistMutationResponse;
import com.marketplace.wishlist.dto.WishlistProductResponse;
import com.marketplace.wishlist.service.WishlistService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;
    private final CurrentUserService currentUserService;

    public WishlistController(WishlistService wishlistService, CurrentUserService currentUserService) {
        this.wishlistService = wishlistService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public Page<WishlistProductResponse> getWishlist(@PageableDefault(size = 12) Pageable pageable) {
        return wishlistService.getWishlist(currentUserService.getCurrentUserId(), pageable);
    }

    @GetMapping("/{productId}/status")
    public WishlistMutationResponse getWishlistStatus(@PathVariable Integer productId) {
        return wishlistService.getWishlistStatus(currentUserService.getCurrentUserId(), productId);
    }

    @PostMapping("/{productId}")
    @ResponseStatus(HttpStatus.CREATED)
    public WishlistMutationResponse addToWishlist(@PathVariable Integer productId) {
        return wishlistService.addProduct(currentUserService.getCurrentUserId(), productId);
    }

    @DeleteMapping("/{productId}")
    public WishlistMutationResponse removeFromWishlist(@PathVariable Integer productId) {
        return wishlistService.removeProduct(currentUserService.getCurrentUserId(), productId);
    }
}
