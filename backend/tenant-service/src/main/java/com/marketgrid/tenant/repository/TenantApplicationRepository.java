package com.marketgrid.tenant.repository;

import com.marketgrid.tenant.entity.TenantApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TenantApplicationRepository
        extends JpaRepository<TenantApplication, Long> {

    List<TenantApplication> findByStatusOrderBySubmittedAtDesc(
            TenantApplication.Status status);

    boolean existsByRequestedSlugAndStatus(
            String requestedSlug,
            TenantApplication.Status status);
}
