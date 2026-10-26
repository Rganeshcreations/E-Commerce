package com.marketgrid.tenant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SubmitVendorApplicationRequest {
    @NotBlank @Size(max = 100)
    private String applicantName;
    @NotBlank @Email @Size(max = 254)
    private String applicantEmail;
    @NotBlank @Size(max = 100)
    private String tenantSlug;
    @NotBlank @Size(max = 120)
    private String businessName;
    @NotBlank @Size(min = 8, max = 72)
    private String password;

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String v) { applicantName = v; }
    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String v) { applicantEmail = v; }
    public String getTenantSlug() { return tenantSlug; }
    public void setTenantSlug(String v) { tenantSlug = v; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String v) { businessName = v; }
    public String getPassword() { return password; }
    public void setPassword(String v) { password = v; }
}