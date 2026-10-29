package com.marketgrid.tenant.dto;

import com.marketgrid.tenant.entity.Domain;
import java.time.LocalDateTime;

public class DomainResponse {
    private final Long id;
    private final String name;
    private final String description;
    private final Long tenantId;
    private final String tenantName;
    private final LocalDateTime createdAt;

    public DomainResponse(Domain domain, String tenantName) {
        this.id = domain.getId();
        this.name = domain.getName();
        this.description = domain.getDescription();
        this.tenantId = domain.getTenantId();
        this.tenantName = tenantName;
        this.createdAt = domain.getCreatedAt();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Long getTenantId() { return tenantId; }
    public String getTenantName() { return tenantName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
