package com.marketgrid.tenant.service;

import com.marketgrid.tenant.dto.CreateTenantRequest;
import com.marketgrid.tenant.entity.BusinessDomain;
import com.marketgrid.tenant.entity.Tenant;
import com.marketgrid.tenant.entity.TenantApplication;
import com.marketgrid.tenant.repository.BusinessDomainRepository;
import com.marketgrid.tenant.repository.TenantApplicationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Locale;

@Service
public class TenantApplicationService {
    private final TenantApplicationRepository applicationRepository;
    private final TenantService tenantService;
    private final BusinessDomainRepository domainRepository;
    private final RestTemplate restTemplate;
    private final String provisioningSecret;

    public TenantApplicationService(TenantApplicationRepository applicationRepository,
            TenantService tenantService, BusinessDomainRepository domainRepository,
            RestTemplate restTemplate,
            @Value("${app.internal.provisioning-secret:}") String provisioningSecret) {
        this.applicationRepository = applicationRepository;
        this.tenantService = tenantService;
        this.domainRepository = domainRepository;
        this.restTemplate = restTemplate;
        this.provisioningSecret = provisioningSecret;
    }

    @Transactional
    public TenantApplication submit(Long applicantUserId, String applicantName, String applicantEmail,
            String storeName, String requestedSlug, String requestedDomainSlug) {
        if (applicantUserId == null || applicantUserId <= 0)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "A signed-in applicant account is required");
        if (applicantName == null || applicantName.isBlank())
            throw new IllegalArgumentException("Applicant name is required");
        if (applicantEmail == null || !applicantEmail.trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
            throw new IllegalArgumentException("A valid applicant email is required");
        if (storeName == null || storeName.isBlank())
            throw new IllegalArgumentException("Store name is required");
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
        application.setApplicantUserId(applicantUserId);
        application.setApplicantName(applicantName.trim());
        application.setApplicantEmail(applicantEmail.trim().toLowerCase(Locale.ROOT));
        application.setStoreName(storeName.trim());
        application.setRequestedSlug(slug);
        application.setRequestedDomainSlug(domainSlug);
        application.setApplicantPasswordHash(null);
        application.setStatus(TenantApplication.Status.PENDING);
        return applicationRepository.save(application);
    }

    @Transactional(readOnly = true)
    public List<TenantApplication> getAll() { return applicationRepository.findAll(); }

    @Transactional(readOnly = true)
    public List<TenantApplication> getMine(Long applicantUserId) {
        return applicationRepository.findByApplicantUserIdOrderBySubmittedAtDesc(applicantUserId);
    }

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

        // Promote the applicant's existing account. Never create a duplicate login.
        if (provisioningSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Internal account provisioning is not configured");
        }
        if (application.getApplicantUserId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This legacy application has no linked applicant account; submit a new application after signing in");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-MarketGrid-Service-Secret", provisioningSecret);
        PromotionRequest promotion = new PromotionRequest(tenant.getId());
        try {
            restTemplate.postForEntity(
                    "http://user-service/internal/provisioning/accounts/" + application.getApplicantUserId() + "/promote",
                    new HttpEntity<>(promotion, headers), String.class);
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Approval could not finish because the existing account could not be promoted");
        }

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

    public static class PromotionRequest {
        private final Long tenantId;
        public PromotionRequest(Long tenantId) { this.tenantId = tenantId; }
        public Long getTenantId() { return tenantId; }
    }

    private TenantApplication findPending(Long applicationId) {
        TenantApplication application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new TenantNotFoundException("Tenant application not found"));
        if (application.getStatus() != TenantApplication.Status.PENDING)
            throw new IllegalArgumentException("Only pending applications can be reviewed");
        return application;
    }
}
