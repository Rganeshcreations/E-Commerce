package com.marketgrid.product.repository;

import com.marketgrid.product.entity.TenantCatalogProduct;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface TenantCatalogRepository
        extends JpaRepository<TenantCatalogProduct, Long> {

    List<TenantCatalogProduct> findAllByTenantIdOrderByIdDesc(Long tenantId);

    List<TenantCatalogProduct> findAllByTenantIdAndStatusIgnoreCaseOrderByIdDesc(
            Long tenantId, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from TenantCatalogProduct p where p.id = :id and p.tenantId = :tenantId")
    Optional<TenantCatalogProduct> findForAllocation(
            @Param("id") Long id, @Param("tenantId") Long tenantId);
}
