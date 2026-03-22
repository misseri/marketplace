package com.marketplace.product.repository;

import com.marketplace.product.model.ProductPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ProductPriceRepository extends JpaRepository<ProductPrice, Integer> {

    interface ProductCurrentPriceView {
        Integer getProductId();
        BigDecimal getPrice();
    }

    @Query("""
            select pp.product.id as productId, pp.price as price
            from ProductPrice pp
            where pp.product.id in :productIds
              and pp.startDate <= current_date
              and (pp.endDate is null or pp.endDate >= current_date)
              and pp.startDate = (
                    select max(pp2.startDate)
                    from ProductPrice pp2
                    where pp2.product.id = pp.product.id
                      and pp2.startDate <= current_date
                      and (pp2.endDate is null or pp2.endDate >= current_date)
              )
            """)
    List<ProductCurrentPriceView> findCurrentPrices(@Param("productIds") List<Integer> productIds);

    @Query("""
            select pp.price
            from ProductPrice pp
            where pp.product.id = :productId
              and pp.startDate <= current_date
              and (pp.endDate is null or pp.endDate >= current_date)
              and pp.startDate = (
                    select max(pp2.startDate)
                    from ProductPrice pp2
                    where pp2.product.id = pp.product.id
                      and pp2.startDate <= current_date
                      and (pp2.endDate is null or pp2.endDate >= current_date)
              )
            """)
    Optional<BigDecimal> findCurrentPrice(@Param("productId") Integer productId);
}
