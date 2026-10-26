package com.marketgrid.user.dto;

/** Request accepted only by the private service-to-service provisioning endpoint. */
public class InternalProvisioningRequest {
    private Long tenantId;
    private String fullName;
    private String email;
    private String passwordHash;
    private String role;

    public InternalProvisioningRequest() {}
    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
