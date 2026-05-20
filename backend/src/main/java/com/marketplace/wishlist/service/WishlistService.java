package com.marketplace.wishlist.service;

import com.marketplace.auth.service.UserService;
import com.marketplace.product.service.ProductService;
import com.marketplace.wishlist.dto.WishlistMutationResponse;
import com.marketplace.wishlist.dto.WishlistProductResponse;
import com.marketplace.wishlist.model.WishlistItem;
import com.marketplace.wishlist.repository.WishlistRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserService userService;
    private final ProductService productService;
    private final WishlistProductResponseAssembler wishlistProductResponseAssembler;

    public WishlistService(WishlistRepository wishlistRepository,
                           UserService userService,
                           ProductService productService,
                           WishlistProductResponseAssembler wishlistProductResponseAssembler) {
        this.wishlistRepository = wishlistRepository;
        this.userService = userService;
        this.productService = productService;
        this.wishlistProductResponseAssembler = wishlistProductResponseAssembler;
    }

    @Transactional(readOnly = true)
    public Page<WishlistProductResponse> getWishlist(Integer userId, Pageable pageable) {
        Page<WishlistItem> wishlistItems = wishlistRepository.findByUserIdOrderByIdDesc(userId, pageable);
        return new PageImpl<>(
                wishlistProductResponseAssembler.toResponses(wishlistItems.getContent()),
                pageable,
                wishlistItems.getTotalElements()
        );
    }

    @Transactional
    public WishlistMutationResponse addProduct(Integer userId, Integer productId) {
        List<WishlistItem> existingItems = wishlistRepository.findAllByUserIdAndProductIdOrderByIdAsc(userId, productId);
        if (!existingItems.isEmpty()) {
            return new WishlistMutationResponse(existingItems.getFirst().getId(), productId, true);
        }

        WishlistItem wishlistItem = new WishlistItem();
        wishlistItem.setUser(userService.getById(userId));
        wishlistItem.setProduct(productService.getActiveProductEntity(productId));

        WishlistItem savedItem = wishlistRepository.save(wishlistItem);
        return new WishlistMutationResponse(savedItem.getId(), productId, true);
    }

    @Transactional
    public WishlistMutationResponse removeProduct(Integer userId, Integer productId) {
        List<WishlistItem> existingItems = wishlistRepository.findAllByUserIdAndProductIdOrderByIdAsc(userId, productId);
        if (existingItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Товар не найден в избранном");
        }

        Integer wishlistItemId = existingItems.getFirst().getId();
        wishlistRepository.deleteAll(existingItems);
        return new WishlistMutationResponse(wishlistItemId, productId, false);
    }

    @Transactional(readOnly = true)
    public WishlistMutationResponse getWishlistStatus(Integer userId, Integer productId) {
        WishlistItem existingItem = wishlistRepository.findByUserIdAndProductId(userId, productId).orElse(null);
        return new WishlistMutationResponse(
                existingItem == null ? null : existingItem.getId(),
                productId,
                existingItem != null
        );
    }
}
