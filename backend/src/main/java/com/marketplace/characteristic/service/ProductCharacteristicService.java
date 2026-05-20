package com.marketplace.characteristic.service;

import com.marketplace.characteristic.dto.ProductCharacteristicResponse;
import com.marketplace.characteristic.model.ProductCharacteristic;
import com.marketplace.characteristic.repository.ProductCharacteristicRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProductCharacteristicService {

    private final ProductCharacteristicRepository productCharacteristicRepository;

    public ProductCharacteristicService(ProductCharacteristicRepository productCharacteristicRepository) {
        this.productCharacteristicRepository = productCharacteristicRepository;
    }

    public List<ProductCharacteristicResponse> getCharacteristicsByProductId(Integer productId) {
        return productCharacteristicRepository.findByProductIdOrderByCharacteristicIdAsc(productId).stream()
                .map(this::toResponse)
                .toList();
    }

    private ProductCharacteristicResponse toResponse(ProductCharacteristic characteristic) {
        return new ProductCharacteristicResponse(
                characteristic.getCharacteristic().getId(),
                characteristic.getCharacteristic().getName(),
                characteristic.getValue()
        );
    }
}
