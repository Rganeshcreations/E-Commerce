package com.marketgrid.tenant.dto;

import com.marketgrid.tenant.entity.BusinessDomain;

public class BusinessDomainResponse {

    private final Long id;
    private final String name;
    private final String slug;
    private final Long allocatedTenantId;
    private final String allocatedTenantName;
    private final boolean available;

    public BusinessDomainResponse(
            BusinessDomain domain,
            String allocatedTenantName) {
        this.id = domain.getId();
        this.name = domain.getName();
        this.slug = domain.getSlug();
        this.allocatedTenantId = domain.getAllocatedTenantId();
        this.allocatedTenantName = allocatedTenantName;
        this.available = domain.getAllocatedTenantId() == null;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public Long getAllocatedTenantId() { return allocatedTenantId; }
    public String getAllocatedTenantName() { return allocatedTenantName; }
    public boolean isAvailable() { return available; }
}
