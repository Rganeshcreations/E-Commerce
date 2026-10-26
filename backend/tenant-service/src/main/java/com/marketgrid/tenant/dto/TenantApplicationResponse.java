package com.marketgrid.tenant.dto;

import com.marketgrid.tenant.entity.TenantApplication;
import java.time.LocalDateTime;

public class TenantApplicationResponse {
    private final Long id;
    private final String applicantName;
    private final String applicantEmail;
    private final String storeName;
    private final String requestedSlug;
    private final String requestedDomainSlug;
    private final String status;
    private final String reviewNote;
    private final LocalDateTime submittedAt;
    private final LocalDateTime reviewedAt;

    public TenantApplicationResponse(TenantApplication a) {
        id = a.getId();
        applicantName = a.getApplicantName();
        applicantEmail = a.getApplicantEmail();
        storeName = a.getStoreName();
        requestedSlug = a.getRequestedSlug();
        requestedDomainSlug = a.getRequestedDomainSlug();
        status = a.getStatus().name();
        reviewNote = a.getReviewNote();
        submittedAt = a.getSubmittedAt();
        reviewedAt = a.getReviewedAt();
    }
    public Long getId() { return id; }
    public String getApplicantName() { return applicantName; }
    public String getApplicantEmail() { return applicantEmail; }
    public String getStoreName() { return storeName; }
    public String getRequestedSlug() { return requestedSlug; }
    public String getRequestedDomainSlug() { return requestedDomainSlug; }
    public String getStatus() { return status; }
    public String getReviewNote() { return reviewNote; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
}