package com.marketplace.characteristic.repository;

import com.marketplace.characteristic.model.ProductCharacteristic;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductCharacteristicRepository extends JpaRepository<ProductCharacteristic, Integer> {

    @EntityGraph(attributePaths = {"characteristic"})
    List<ProductCharacteristic> findByProductIdOrderByCharacteristicIdAsc(Integer productId);
}
