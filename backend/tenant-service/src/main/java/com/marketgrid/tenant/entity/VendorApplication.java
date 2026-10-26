package com.marketgrid.tenant.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_applications")
public class VendorApplication {
    public enum Status { PENDING, APPROVED, REJECTED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String applicantName;
    @Column(nullable = false, length = 254)
    private String applicantEmail;
    @Column(nullable = false, length = 100)
    private String tenantSlug;
    @Column(nullable = false, length = 120)
    private String businessName;
    @Column(name = "applicant_password_hash", length = 100)
    private String applicantPasswordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    public VendorApplication() {}
    @PrePersist protected void onCreate() { submittedAt = LocalDateTime.now(); }
    public Long getId() { return id; }
    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String v) { applicantName = v; }
    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String v) { applicantEmail = v; }
    public String getTenantSlug() { return tenantSlug; }
    public void setTenantSlug(String v) { tenantSlug = v; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String v) { businessName = v; }
    public String getApplicantPasswordHash() { return applicantPasswordHash; }
    public void setApplicantPasswordHash(String v) { applicantPasswordHash = v; }
    public Status getStatus() { return status; }
    public void setStatus(Status v) { status = v; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
}