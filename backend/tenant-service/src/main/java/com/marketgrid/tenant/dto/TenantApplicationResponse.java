package com.marketgrid.tenant.dto;

import com.marketgrid.tenant.entity.TenantApplication;
import java.time.LocalDateTime;

public class TenantApplicationResponse {

    private Long id;
    private String applicantName;
    private String applicantEmail;
    private String storeName;
    private String requestedSlug;
    private String status;
    private String reviewNote;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;

    public TenantApplicationResponse(TenantApplication application) {
        this.id = application.getId();
        this.applicantName = application.getApplicantName();
        this.applicantEmail = application.getApplicantEmail();
        this.storeName = application.getStoreName();
        this.requestedSlug = application.getRequestedSlug();
        this.status = application.getStatus().name();
        this.reviewNote = application.getReviewNote();
        this.submittedAt = application.getSubmittedAt();
        this.reviewedAt = application.getReviewedAt();
    }

    public Long getId() { return id; }
    public String getApplicantName() { return applicantName; }
    public String getApplicantEmail() { return applicantEmail; }
    public String getStoreName() { return storeName; }
    public String getRequestedSlug() { return requestedSlug; }
    public String getStatus() { return status; }
    public String getReviewNote() { return reviewNote; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
}
