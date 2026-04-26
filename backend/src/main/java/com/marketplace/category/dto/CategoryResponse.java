package com.marketplace.category.dto;

public record CategoryResponse(
        Integer id,
        String name,
        Integer parentId,
        boolean hasChildren
) {
}
