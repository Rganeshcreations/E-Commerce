package com.marketgrid.vendor.repository;

import com.marketgrid.vendor.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VendorRepository extends JpaRepository<Vendor, Long> {

    List<Vendor> findAllByTenantId(Long tenantId);

    Optional<Vendor> findByIdAndTenantId(Long id, Long tenantId);

    Optional<Vendor> findByEmailAndTenantId(String email, Long tenantId);
}
