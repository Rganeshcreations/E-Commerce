package com.marketgrid.order.repository;

import com.marketgrid.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByTenantId(Long tenantId);

    List<Order> findAllByTenantIdAndCustomerId(Long tenantId, Long customerId);

    // A customer can have orders in more than one tenant.
    List<Order> findAllByCustomerId(Long customerId);

    Optional<Order> findByIdAndTenantId(Long id, Long tenantId);

    @Query("""
        SELECT DISTINCT o
        FROM Order o
        JOIN o.items i
        WHERE o.tenantId = :tenantId
          AND i.vendorId = :vendorId
    """)
    List<Order> findAllByTenantIdAndVendorId(
            @Param("tenantId") Long tenantId,
            @Param("vendorId") Long vendorId
    );
}
