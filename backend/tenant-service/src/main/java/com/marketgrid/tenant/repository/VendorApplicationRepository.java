package com.marketgrid.tenant.repository;

import com.marketgrid.tenant.entity.VendorApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VendorApplicationRepository extends JpaRepository<VendorApplication, Long> {
    List<VendorApplication> findByStatusOrderBySubmittedAtDesc(VendorApplication.Status status);
    boolean existsByApplicantEmailAndTenantSlugAndStatus(
        String applicantEmail, String tenantSlug, VendorApplication.Status status);
}