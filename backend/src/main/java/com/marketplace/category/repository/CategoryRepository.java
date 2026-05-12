package com.marketplace.category.repository;

import com.marketplace.category.model.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    Page<Category> findAllByParentIsNullOrderByNameAsc(Pageable pageable);

    Page<Category> findAllByParentIdOrderByNameAsc(Integer parentId, Pageable pageable);

    boolean existsByParentId(Integer parentId);
}
