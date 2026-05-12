package com.marketplace.product.repository;

import com.marketplace.product.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    @EntityGraph(attributePaths = {"seller", "category", "stock"})
    @Query(
            value = """
                    select p
                    from Product p
                    left join p.stock stock
                    where p.active = true
                      and (:query = ''
                           or lower(p.name) like lower(concat('%', :query, '%'))
                           or lower(p.description) like lower(concat('%', :query, '%')))
                      and (:applyCategoryFilter = false or p.category.id in :categoryIds)
                      and (:sellerId is null or p.seller.id = :sellerId)
                      and (
                            :inStock is null
                            or (:inStock = true and coalesce(stock.quantity, 0) > 0)
                            or (:inStock = false and coalesce(stock.quantity, 0) <= 0)
                      )
                      and (
                            :minPrice is null
                            or exists (
                                select 1
                                from ProductPrice price
                                where price.product = p
                                  and price.startDate <= current_date
                                  and (price.endDate is null or price.endDate >= current_date)
                                  and price.price >= :minPrice
                            )
                      )
                      and (
                            :maxPrice is null
                            or exists (
                                select 1
                                from ProductPrice price
                                where price.product = p
                                  and price.startDate <= current_date
                                  and (price.endDate is null or price.endDate >= current_date)
                                  and price.price <= :maxPrice
                            )
                      )
                    """,
            countQuery = """
                    select count(p)
                    from Product p
                    left join p.stock stock
                    where p.active = true
                      and (:query = ''
                           or lower(p.name) like lower(concat('%', :query, '%'))
                           or lower(p.description) like lower(concat('%', :query, '%')))
                      and (:applyCategoryFilter = false or p.category.id in :categoryIds)
                      and (:sellerId is null or p.seller.id = :sellerId)
                      and (
                            :inStock is null
                            or (:inStock = true and coalesce(stock.quantity, 0) > 0)
                            or (:inStock = false and coalesce(stock.quantity, 0) <= 0)
                      )
                      and (
                            :minPrice is null
                            or exists (
                                select 1
                                from ProductPrice price
                                where price.product = p
                                  and price.startDate <= current_date
                                  and (price.endDate is null or price.endDate >= current_date)
                                  and price.price >= :minPrice
                            )
                      )
                      and (
                            :maxPrice is null
                            or exists (
                                select 1
                                from ProductPrice price
                                where price.product = p
                                  and price.startDate <= current_date
                                  and (price.endDate is null or price.endDate >= current_date)
                                  and price.price <= :maxPrice
                            )
                      )
                    """
    )
    Page<Product> search(
            @Param("query") String query,
            @Param("applyCategoryFilter") boolean applyCategoryFilter,
            @Param("categoryIds") Collection<Integer> categoryIds,
            @Param("sellerId") Integer sellerId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("inStock") Boolean inStock,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"seller", "category", "stock"})
    @Query(
            value = """
                    select p
                    from Product p
                    left join p.stock stock
                    where p.active = true
                      and (:applyProductIdFilter = false or p.id in :productIds)
                      and (:applyCategoryFilter = false or p.category.id in :categoryIds)
                      and (:sellerId is null or p.seller.id = :sellerId)
                      and (
                            :inStock is null
                            or (:inStock = true and coalesce(stock.quantity, 0) > 0)
                            or (:inStock = false and coalesce(stock.quantity, 0) <= 0)
                      )
                      and (
                            :minPrice is null
                            or exists (
                                select 1
                                from ProductPrice price
                                where price.product = p
                                  and price.startDate <= current_date
                                  and (price.endDate is null or price.endDate >= current_date)
                                  and price.price >= :minPrice
                            )
                      )
                      and (
                            :maxPrice is null
                            or exists (
                                select 1
                                from ProductPrice price
                                where price.product = p
                                  and price.startDate <= current_date
                                  and (price.endDate is null or price.endDate >= current_date)
                                  and price.price <= :maxPrice
                            )
                      )
                    """,
            countQuery = """
                    select count(p)
                    from Product p
                    left join p.stock stock
                    where p.active = true
                      and (:applyProductIdFilter = false or p.id in :productIds)
                      and (:applyCategoryFilter = false or p.category.id in :categoryIds)
                      and (:sellerId is null or p.seller.id = :sellerId)
                      and (
                            :inStock is null
                            or (:inStock = true and coalesce(stock.quantity, 0) > 0)
                            or (:inStock = false and coalesce(stock.quantity, 0) <= 0)
                      )
                      and (
                            :minPrice is null
                            or exists (
                                select 1
                                from ProductPrice price
                                where price.product = p
                                  and price.startDate <= current_date
                                  and (price.endDate is null or price.endDate >= current_date)
                                  and price.price >= :minPrice
                            )
                      )
                      and (
                            :maxPrice is null
                            or exists (
                                select 1
                                from ProductPrice price
                                where price.product = p
                                  and price.startDate <= current_date
                                  and (price.endDate is null or price.endDate >= current_date)
                                  and price.price <= :maxPrice
                            )
                      )
                    """
    )
    Page<Product> searchByProductIds(
            @Param("applyProductIdFilter") boolean applyProductIdFilter,
            @Param("productIds") Collection<Integer> productIds,
            @Param("applyCategoryFilter") boolean applyCategoryFilter,
            @Param("categoryIds") Collection<Integer> categoryIds,
            @Param("sellerId") Integer sellerId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("inStock") Boolean inStock,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"seller", "category", "stock"})
    Optional<Product> findByIdAndActiveTrue(Integer id);

    @EntityGraph(attributePaths = {"category"})
    List<Product> findAllByActiveTrue();
}
