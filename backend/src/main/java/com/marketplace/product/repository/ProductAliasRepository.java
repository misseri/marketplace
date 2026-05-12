package com.marketplace.product.repository;

import com.marketplace.product.model.ProductAlias;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProductAliasRepository extends JpaRepository<ProductAlias, Integer> {

    List<ProductAlias> findAllByProduct_IdIn(Collection<Integer> productIds);

    @Query("""
            select distinct pa.product.id
            from ProductAlias pa
            where pa.product.active = true
              and lower(pa.alias) like lower(concat('%', :query, '%'))
            order by pa.product.id
            """)
    List<Integer> searchActiveProductIdsByAlias(@Param("query") String query, Pageable pageable);
}
