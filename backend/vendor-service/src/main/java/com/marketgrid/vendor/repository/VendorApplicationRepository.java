package com.marketgrid.vendor.repository;

import com.marketgrid.vendor.entity.VendorApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VendorApplicationRepository extends JpaRepository<VendorApplication,Long> {
    List<VendorApplication> findAllByTenantIdOrderBySubmittedAtDesc(Long tenantId);
    List<VendorApplication> findAllByTenantIdAndStatusOrderBySubmittedAtDesc(Long tenantId, VendorApplication.Status status);
    Optional<VendorApplication> findByIdAndTenantId(Long id, Long tenantId);
    boolean existsByTenantIdAndEmailAndStatus(Long tenantId, String email, VendorApplication.Status status);
}