package com.marketgrid.tenant.repository;

import com.marketgrid.tenant.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findBySlug(String slug);

    boolean existsBySlug(String slug);\n\n    java.util.List<Tenant> findByActiveTrueOrderByNameAsc();
}
