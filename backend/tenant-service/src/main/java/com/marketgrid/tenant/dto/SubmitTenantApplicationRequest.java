package com.marketgrid.tenant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SubmitTenantApplicationRequest {

    @NotBlank
    @Size(max = 100)
    private String applicantName;

    @NotBlank
    @Email
    @Size(max = 254)
    private String applicantEmail;

    @NotBlank
    @Size(max = 100)
    private String storeName;

    @NotBlank
    @Size(max = 100)
    private String requestedSlug;

    public SubmitTenantApplicationRequest() {}

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String applicantEmail) { this.applicantEmail = applicantEmail; }

    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }

    public String getRequestedSlug() { return requestedSlug; }
    public void setRequestedSlug(String requestedSlug) { this.requestedSlug = requestedSlug; }
}
