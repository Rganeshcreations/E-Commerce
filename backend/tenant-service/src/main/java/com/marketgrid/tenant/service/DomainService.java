package com.marketgrid.tenant.service;

import com.marketgrid.tenant.dto.CreateDomainRequest;
import com.marketgrid.tenant.dto.DomainResponse;
import com.marketgrid.tenant.entity.Domain;
import com.marketgrid.tenant.entity.Tenant;
import com.marketgrid.tenant.repository.DomainRepository;
import com.marketgrid.tenant.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class DomainService {
    private final DomainRepository domainRepository;
    private final TenantRepository tenantRepository;

    public DomainService(DomainRepository domainRepository, TenantRepository tenantRepository) {
        this.domainRepository = domainRepository;
        this.tenantRepository = tenantRepository;
    }

    @Transactional(readOnly = true)
    public List<DomainResponse> getAll() {
        return domainRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public DomainResponse create(CreateDomainRequest request) {
        String name = request.getName().trim();
        if (domainRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("A domain with this name already exists.");
        }
        Domain domain = new Domain();
        domain.setName(name);
        domain.setDescription(request.getDescription() == null ? "" : request.getDescription().trim());
        return toResponse(domainRepository.save(domain));
    }

    @Transactional
    public DomainResponse assign(Long domainId, Long tenantId) {
        Domain domain = domainRepository.findById(domainId)
            .orElseThrow(() -> new IllegalArgumentException("Domain not found."));
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found."));
        if (domain.getTenantId() != null && !domain.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("This domain is already assigned to another tenant.");
        }
        boolean anotherDomainForTenant = domainRepository.findAll().stream()
            .anyMatch(d -> tenantId.equals(d.getTenantId()) && !d.getId().equals(domainId));
        if (anotherDomainForTenant) {
            throw new IllegalArgumentException("This tenant already has a domain assigned.");
        }
        domain.setTenantId(tenant.getId());
        return toResponse(domainRepository.save(domain));
    }

    @Transactional
    public DomainResponse unassign(Long domainId) {
        Domain domain = domainRepository.findById(domainId)
            .orElseThrow(() -> new IllegalArgumentException("Domain not found."));
        domain.setTenantId(null);
        return toResponse(domainRepository.save(domain));
    }

    private DomainResponse toResponse(Domain domain) {
        String tenantName = domain.getTenantId() == null ? null :
            tenantRepository.findById(domain.getTenantId()).map(Tenant::getName).orElse(null);
        return new DomainResponse(domain, tenantName);
    }
}
