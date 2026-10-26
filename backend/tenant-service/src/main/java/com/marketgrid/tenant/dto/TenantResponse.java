package com.marketgrid.tenant.dto;

import com.marketgrid.tenant.entity.Tenant;
import java.time.LocalDateTime;

public class TenantResponse {

    private final Long id;
    private final String name;
    private final String slug;
    private final boolean active;
    private final LocalDateTime createdAt;

    public TenantResponse(Tenant tenant) {
        this.id = tenant.getId();
        this.name = tenant.getName();
        this.slug = tenant.getSlug();
        this.active = tenant.isActive();
        this.createdAt = tenant.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public boolean isActive() {
        return active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
