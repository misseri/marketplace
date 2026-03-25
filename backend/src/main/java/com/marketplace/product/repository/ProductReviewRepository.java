package com.marketplace.product.repository;

import com.marketplace.product.model.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Integer> {

    interface ProductReviewStatsView {
        Integer getProductId();
        Double getAverageRating();
        Long getReviewCount();
    }

    @Query("""
            select r.product.id as productId,
                   avg(r.rating) as averageRating,
                   count(r.id) as reviewCount
            from ProductReview r
            where r.product.id in :productIds
            group by r.product.id
            """)
    List<ProductReviewStatsView> findStatsByProductIds(@Param("productIds") List<Integer> productIds);

    @Query("""
            select r.product.id as productId,
                   avg(r.rating) as averageRating,
                   count(r.id) as reviewCount
            from ProductReview r
            where r.product.id = :productId
            group by r.product.id
            """)
    Optional<ProductReviewStatsView> findStatsByProductId(@Param("productId") Integer productId);
}
