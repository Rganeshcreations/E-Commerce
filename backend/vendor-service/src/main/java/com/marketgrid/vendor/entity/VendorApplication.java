package com.marketgrid.vendor.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="vendor_applications", indexes=@Index(name="idx_vendor_app_tenant_status", columnList="tenant_id,status"))
public class VendorApplication {
    public enum Status { PENDING, APPROVED, REJECTED }
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="tenant_id", nullable=false) private Long tenantId;
    @Column(name="applicant_name", nullable=false, length=100) private String applicantName;
    @Column(nullable=false, length=254) private String email;
    @Column(name="business_name", nullable=false, length=150) private String businessName;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private Status status=Status.PENDING;
    @Column(name="review_message", length=1000) private String reviewMessage;
    @Column(name="submitted_at", nullable=false, updatable=false) private LocalDateTime submittedAt;
    @Column(name="reviewed_at") private LocalDateTime reviewedAt;
    public VendorApplication() {}
    @PrePersist protected void onCreate(){if(submittedAt==null)submittedAt=LocalDateTime.now();if(status==null)status=Status.PENDING;}
    public Long getId(){return id;} public Long getTenantId(){return tenantId;} public void setTenantId(Long v){tenantId=v;}
    public String getApplicantName(){return applicantName;} public void setApplicantName(String v){applicantName=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getBusinessName(){return businessName;} public void setBusinessName(String v){businessName=v;}
    public Status getStatus(){return status;} public void setStatus(Status v){status=v;}
    public String getReviewMessage(){return reviewMessage;} public void setReviewMessage(String v){reviewMessage=v;}
    public LocalDateTime getSubmittedAt(){return submittedAt;} public LocalDateTime getReviewedAt(){return reviewedAt;} public void setReviewedAt(LocalDateTime v){reviewedAt=v;}
}