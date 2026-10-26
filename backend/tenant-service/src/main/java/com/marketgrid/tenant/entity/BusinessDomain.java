package com.marketgrid.tenant.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "business_domains",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_business_domains_name",
        columnNames = "name"
    )
)
public class BusinessDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    // A domain can be allocated to at most one tenant.
    // Null means that the domain is available.
    @Column(name = "allocated_tenant_id", unique = true)
    private Long allocatedTenantId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public BusinessDomain() {
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public Long getAllocatedTenantId() { return allocatedTenantId; }
    public void setAllocatedTenantId(Long allocatedTenantId) {
        this.allocatedTenantId = allocatedTenantId;
    }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
