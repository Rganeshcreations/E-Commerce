package com.marketgrid.tenant.repository;

import com.marketgrid.tenant.entity.BusinessDomain;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BusinessDomainRepository extends JpaRepository<BusinessDomain, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsBySlug(String slug);

    Optional<BusinessDomain> findBySlug(String slug);

    List<BusinessDomain> findAllByOrderByNameAsc();
}
