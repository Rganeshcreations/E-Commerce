package com.marketgrid.tenant.repository;

import com.marketgrid.tenant.entity.Domain;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DomainRepository extends JpaRepository<Domain, Long> {
    boolean existsByNameIgnoreCase(String name);
    Optional<Domain> findByNameIgnoreCase(String name);
}
