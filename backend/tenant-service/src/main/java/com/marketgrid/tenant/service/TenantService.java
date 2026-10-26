package com.marketgrid.tenant.service;

import com.marketgrid.tenant.dto.CreateTenantRequest;
import com.marketgrid.tenant.entity.Tenant;
import com.marketgrid.tenant.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Transactional
    public Tenant create(CreateTenantRequest request) {
        String name = request.getName().trim();
        String slug = request.getSlug().trim().toLowerCase(Locale.ROOT);

        if (!slug.matches("[a-z0-9]+(?:-[a-z0-9]+)*")) {
            throw new IllegalArgumentException(
                "Slug must contain lowercase letters, numbers, or single hyphens"
            );
        }

        if (tenantRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Tenant slug already exists");
        }

        Tenant tenant = new Tenant();
        tenant.setName(name);
        tenant.setSlug(slug);
        tenant.setActive(true);

        return tenantRepository.save(tenant);
    }

    @Transactional(readOnly = true)
    public Tenant getActiveBySlug(String slug) {
        Tenant tenant = tenantRepository.findBySlug(
            slug.trim().toLowerCase(Locale.ROOT)
        ).orElseThrow(() ->
            new TenantNotFoundException("Tenant not found")
        );

        if (!tenant.isActive()) {
            throw new TenantNotFoundException("Tenant not found");
        }

        return tenant;
    }

    @Transactional(readOnly = true)
    public List<Tenant> getAll() {
        return tenantRepository.findAll();
    }

    @Transactional
    public Tenant setActive(Long id, boolean active) {
        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() ->
                new TenantNotFoundException("Tenant not found")
            );

        tenant.setActive(active);
        return tenantRepository.save(tenant);
    }
}
