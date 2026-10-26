package com.marketgrid.tenant.service;

import com.marketgrid.tenant.dto.CreateTenantRequest;
import com.marketgrid.tenant.entity.BusinessDomain;
import com.marketgrid.tenant.entity.Tenant;
import com.marketgrid.tenant.entity.TenantApplication;
import com.marketgrid.tenant.repository.BusinessDomainRepository;
import com.marketgrid.tenant.repository.TenantApplicationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class TenantApplicationService {
    private final TenantApplicationRepository applicationRepository;
    private final TenantService tenantService;
    private final BusinessDomainRepository domainRepository;
    private final PasswordEncoder passwordEncoder;

    public TenantApplicationService(TenantApplicationRepository applicationRepository,
            TenantService tenantService, BusinessDomainRepository domainRepository,
            PasswordEncoder passwordEncoder) {
        this.applicationRepository = applicationRepository;
        this.tenantService = tenantService;
        this.domainRepository = domainRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public TenantApplication submit(String applicantName, String applicantEmail,
            String storeName, String requestedSlug, String requestedDomainSlug, String password) {
        if (applicantName == null || applicantName.isBlank())
            throw new IllegalArgumentException("Applicant name is required");
        if (applicantEmail == null || !applicantEmail.trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
            throw new IllegalArgumentException("A valid applicant email is required");
        if (storeName == null || storeName.isBlank())
            throw new IllegalArgumentException("Store name is required");
        if (password == null || password.length() < 8 || password.length() > 72)
            throw new IllegalArgumentException("Password must contain 8 to 72 characters");

        String slug = requestedSlug == null ? "" : requestedSlug.trim().toLowerCase(Locale.ROOT);
        if (!slug.matches("[a-z0-9]+(?:-[a-z0-9]+)*"))
            throw new IllegalArgumentException("Store slug must use letters, numbers, and single hyphens");

        String domainSlug = requestedDomainSlug == null ? "" : requestedDomainSlug.trim().toLowerCase(Locale.ROOT);
        BusinessDomain domain = domainRepository.findBySlug(domainSlug)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid business domain"));
        if (domain.getAllocatedTenantId() != null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This business domain is already allocated");

        if (applicationRepository.existsByRequestedSlugAndStatus(slug, TenantApplication.Status.PENDING))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An application for this store slug is already pending");

        TenantApplication application = new TenantApplication();
        application.setApplicantName(applicantName.trim());
        application.setApplicantEmail(applicantEmail.trim().toLowerCase(Locale.ROOT));
        application.setStoreName(storeName.trim());
        application.setRequestedSlug(slug);
        application.setRequestedDomainSlug(domainSlug);
        application.setApplicantPasswordHash(passwordEncoder.encode(password));
        application.setStatus(TenantApplication.Status.PENDING);
        return applicationRepository.save(application);
    }

    @Transactional(readOnly = true)
    public List<TenantApplication> getAll() { return applicationRepository.findAll(); }

    @Transactional(readOnly = true)
    public List<TenantApplication> getPending() {
        return applicationRepository.findByStatusOrderBySubmittedAtDesc(TenantApplication.Status.PENDING);
    }

    @Transactional
    public Tenant approve(Long applicationId) {
        TenantApplication application = findPending(applicationId);
        BusinessDomain domain = domainRepository.findBySlug(application.getRequestedDomainSlug())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Requested domain no longer exists"));
        if (domain.getAllocatedTenantId() != null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Requested domain has already been allocated");

        CreateTenantRequest request = new CreateTenantRequest();
        request.setName(application.getStoreName());
        request.setSlug(application.getRequestedSlug());
        Tenant tenant = tenantService.create(request);

        domain.setAllocatedTenantId(tenant.getId());
        domainRepository.save(domain);

        application.setStatus(TenantApplication.Status.APPROVED);
        application.setReviewedAt(java.time.LocalDateTime.now());
        application.setReviewNote("Approved");
        applicationRepository.save(application);
        return tenant;
    }

    @Transactional
    public TenantApplication reject(Long applicationId, String reason) {
        TenantApplication application = findPending(applicationId);
        if (reason == null || reason.isBlank())
            throw new IllegalArgumentException("A rejection reason is required");
        application.setStatus(TenantApplication.Status.REJECTED);
        application.setReviewedAt(java.time.LocalDateTime.now());
        application.setReviewNote(reason.trim());
        return applicationRepository.save(application);
    }

    private TenantApplication findPending(Long applicationId) {
        TenantApplication application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new TenantNotFoundException("Tenant application not found"));
        if (application.getStatus() != TenantApplication.Status.PENDING)
            throw new IllegalArgumentException("Only pending applications can be reviewed");
        return application;
    }
}
