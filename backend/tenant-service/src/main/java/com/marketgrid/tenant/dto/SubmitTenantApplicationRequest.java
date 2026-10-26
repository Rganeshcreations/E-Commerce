package com.marketgrid.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Store details only. Applicant identity is taken from the verified JWT, never trusted from the browser. */
public class SubmitTenantApplicationRequest {
    @NotBlank @Size(max = 100)
    private String applicantName;
    @NotBlank @Size(max = 100)
    private String storeName;
    @NotBlank @Size(max = 100)
    private String requestedSlug;
    @NotBlank @Size(max = 80)
    private String requestedDomainSlug;

    public SubmitTenantApplicationRequest() {}
    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String v) { applicantName = v; }
    public String getStoreName() { return storeName; }
    public void setStoreName(String v) { storeName = v; }
    public String getRequestedSlug() { return requestedSlug; }
    public void setRequestedSlug(String v) { requestedSlug = v; }
    public String getRequestedDomainSlug() { return requestedDomainSlug; }
    public void setRequestedDomainSlug(String v) { requestedDomainSlug = v; }
}
