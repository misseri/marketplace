package com.marketplace.wishlist.service;

import com.marketplace.auth.model.User;
import com.marketplace.auth.repository.UserRepository;
import com.marketplace.product.model.Product;
import com.marketplace.product.repository.ProductRepository;
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
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final WishlistProductResponseAssembler wishlistProductResponseAssembler;

    public WishlistService(WishlistRepository wishlistRepository,
                           UserRepository userRepository,
                           ProductRepository productRepository,
                           WishlistProductResponseAssembler wishlistProductResponseAssembler) {
        this.wishlistRepository = wishlistRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
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

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Product product = productRepository.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        WishlistItem wishlistItem = new WishlistItem();
        wishlistItem.setUser(user);
        wishlistItem.setProduct(product);

        WishlistItem savedItem = wishlistRepository.save(wishlistItem);
        return new WishlistMutationResponse(savedItem.getId(), productId, true);
    }

    @Transactional
    public WishlistMutationResponse removeProduct(Integer userId, Integer productId) {
        List<WishlistItem> existingItems = wishlistRepository.findAllByUserIdAndProductIdOrderByIdAsc(userId, productId);
        if (existingItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found in wishlist");
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
