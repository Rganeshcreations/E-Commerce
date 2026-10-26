package com.marketgrid.tenant.controller;

import com.marketgrid.tenant.dto.BusinessDomainResponse;
import com.marketgrid.tenant.dto.CreateBusinessDomainRequest;
import com.marketgrid.tenant.entity.BusinessDomain;
import com.marketgrid.tenant.entity.Tenant;
import com.marketgrid.tenant.repository.BusinessDomainRepository;
import com.marketgrid.tenant.repository.TenantRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/domains")
public class BusinessDomainController {

    private final BusinessDomainRepository domainRepository;
    private final TenantRepository tenantRepository;

    public BusinessDomainController(
            BusinessDomainRepository domainRepository,
            TenantRepository tenantRepository) {
        this.domainRepository = domainRepository;
        this.tenantRepository = tenantRepository;
    }

    // Public registration forms can see which domains are available.
    @GetMapping
    public List<BusinessDomainResponse> getDomains() {
        return domainRepository.findAllByOrderByNameAsc().stream()
            .map(this::toResponse)
            .toList();
    }

    // Only SUPER_ADMIN may create the marketplace's domain categories.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BusinessDomainResponse createDomain(
            @Valid @RequestBody CreateBusinessDomainRequest request) {
        String name = request.getName().trim();
        String slug = request.getSlug().trim().toLowerCase(Locale.ROOT);

        if (domainRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "A domain with this name already exists");
        }
        if (domainRepository.existsBySlug(slug)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "A domain with this slug already exists");
        }

        BusinessDomain domain = new BusinessDomain();
        domain.setName(name);
        domain.setSlug(slug);
        return toResponse(domainRepository.save(domain));
    }

    private BusinessDomainResponse toResponse(BusinessDomain domain) {
        String tenantName = null;
        if (domain.getAllocatedTenantId() != null) {
            tenantName = tenantRepository.findById(domain.getAllocatedTenantId())
                .map(Tenant::getName)
                .orElse("Tenant #" + domain.getAllocatedTenantId());
        }
        return new BusinessDomainResponse(domain, tenantName);
    }
}
