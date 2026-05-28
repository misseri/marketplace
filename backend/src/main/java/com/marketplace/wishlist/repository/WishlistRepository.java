package com.marketplace.wishlist.repository;

import com.marketplace.wishlist.model.WishlistItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Integer> {

    @EntityGraph(attributePaths = {"product", "product.seller", "product.category", "product.stock"})
    Page<WishlistItem> findByUserIdOrderByIdDesc(Integer userId, Pageable pageable);

    @EntityGraph(attributePaths = {"product", "product.seller", "product.category", "product.stock"})
    Optional<WishlistItem> findByUserIdAndProductId(Integer userId, Integer productId);

    @EntityGraph(attributePaths = {"product", "product.seller", "product.category", "product.stock"})
    List<WishlistItem> findAllByUserIdAndProductIdOrderByIdAsc(Integer userId, Integer productId);

    void deleteByUserId(Integer userId);
}
