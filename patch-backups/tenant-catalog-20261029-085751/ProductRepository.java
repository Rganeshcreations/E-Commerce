package com.marketgrid.product.repository;

import com.marketgrid.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findAllByTenantId(Long tenantId);

    // Public marketplace catalog: only active products.
    List<Product> findAllByStatusIgnoreCase(String status);

    // Customer product details must only expose active products.
    Optional<Product> findByIdAndStatusIgnoreCase(Long id, String status);

    List<Product> findAllByTenantIdAndVendorId(
            Long tenantId,
            Long vendorId
    );

    Optional<Product> findByIdAndTenantId(
            Long id,
            Long tenantId
    );
}
