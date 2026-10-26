package com.marketgrid.tenant.service;

import com.marketgrid.tenant.dto.CreateTenantRequest;
import com.marketgrid.tenant.entity.Tenant;
import com.marketgrid.tenant.entity.TenantApplication;
import com.marketgrid.tenant.repository.TenantApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class TenantApplicationService {

    private final TenantApplicationRepository applicationRepository;
    private final TenantService tenantService;

    public TenantApplicationService(
            TenantApplicationRepository applicationRepository,
            TenantService tenantService) {
        this.applicationRepository = applicationRepository;
        this.tenantService = tenantService;
    }

    @Transactional
    public TenantApplication submit(
            String applicantName,
            String applicantEmail,
            String storeName,
            String requestedSlug) {

        if (applicantName == null || applicantName.isBlank()) {
            throw new IllegalArgumentException("Applicant name is required");
        }
        if (applicantEmail == null || applicantEmail.isBlank()
                || !applicantEmail.trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("A valid applicant email is required");
        }
        if (storeName == null || storeName.isBlank()) {
            throw new IllegalArgumentException("Store name is required");
        }
        if (requestedSlug == null || requestedSlug.isBlank()) {
            throw new IllegalArgumentException("Store slug is required");
        }

        String slug = requestedSlug.trim().toLowerCase(Locale.ROOT);

        if (!slug.matches("[a-z0-9]+(?:-[a-z0-9]+)*")) {
            throw new IllegalArgumentException(
                    "Slug must contain lowercase letters, numbers, or single hyphens");
        }

        if (applicationRepository.existsByRequestedSlugAndStatus(
                slug, TenantApplication.Status.PENDING)) {
            throw new IllegalArgumentException(
                    "An application for this store slug is already pending");
        }

        TenantApplication application = new TenantApplication();
        application.setApplicantName(applicantName.trim());
        application.setApplicantEmail(applicantEmail.trim().toLowerCase(Locale.ROOT));
        application.setStoreName(storeName.trim());
        application.setRequestedSlug(slug);
        application.setStatus(TenantApplication.Status.PENDING);

        return applicationRepository.save(application);
    }

    @Transactional(readOnly = true)
    public List<TenantApplication> getAll() {
        return applicationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<TenantApplication> getPending() {
        return applicationRepository.findByStatusOrderBySubmittedAtDesc(
                TenantApplication.Status.PENDING);
    }

    @Transactional
    public Tenant approve(Long applicationId) {
        TenantApplication application = findPending(applicationId);

        CreateTenantRequest request = new CreateTenantRequest();
        request.setName(application.getStoreName());
        request.setSlug(application.getRequestedSlug());

        Tenant tenant = tenantService.create(request);

        application.setStatus(TenantApplication.Status.APPROVED);
        application.setReviewedAt(java.time.LocalDateTime.now());
        application.setReviewNote("Approved");
        applicationRepository.save(application);

        return tenant;
    }

    @Transactional
    public TenantApplication reject(Long applicationId, String reason) {
        TenantApplication application = findPending(applicationId);

        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("A rejection reason is required");
        }

        application.setStatus(TenantApplication.Status.REJECTED);
        application.setReviewedAt(java.time.LocalDateTime.now());
        application.setReviewNote(reason.trim());

        return applicationRepository.save(application);
    }

    private TenantApplication findPending(Long applicationId) {
        TenantApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() ->
                        new TenantNotFoundException("Tenant application not found"));

        if (application.getStatus() != TenantApplication.Status.PENDING) {
            throw new IllegalArgumentException(
                    "Only pending applications can be reviewed");
        }

        return application;
    }
}
