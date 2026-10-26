package com.marketgrid.tenant.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_applications")
public class TenantApplication {
    public enum Status { PENDING, APPROVED, REJECTED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String applicantName;
    @Column(nullable = false, length = 254)
    private String applicantEmail;
    @Column(nullable = false, length = 100)
    private String storeName;
    @Column(nullable = false, length = 100)
    private String requestedSlug;
    @Column(nullable = false, length = 80)
    private String requestedDomainSlug;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;
    @Column(length = 1000)
    private String reviewNote;
    @Column(nullable = false, updatable = false)
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;

    public TenantApplication() {}
    @PrePersist protected void onCreate() { submittedAt = LocalDateTime.now(); }
    public Long getId() { return id; }
    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String v) { applicantName = v; }
    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String v) { applicantEmail = v; }
    public String getStoreName() { return storeName; }
    public void setStoreName(String v) { storeName = v; }
    public String getRequestedSlug() { return requestedSlug; }
    public void setRequestedSlug(String v) { requestedSlug = v; }
    public String getRequestedDomainSlug() { return requestedDomainSlug; }
    public void setRequestedDomainSlug(String v) { requestedDomainSlug = v; }
    public Status getStatus() { return status; }
    public void setStatus(Status v) { status = v; }
    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String v) { reviewNote = v; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime v) { reviewedAt = v; }
}