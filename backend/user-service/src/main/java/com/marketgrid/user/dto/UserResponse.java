package com.marketgrid.user.dto;

import com.marketgrid.user.entity.User;

public class UserResponse {
    private Long id;
    private Long tenantId;
    private String fullName;
    private String email;
    private String role;
    private boolean active;

    public UserResponse(User user) {
        this.id = user.getId();
        this.tenantId = user.getTenantId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.active = user.isActive();
    }

    public Long getId() { return id; }
    public Long getTenantId() { return tenantId; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public boolean isActive() { return active; }
}
