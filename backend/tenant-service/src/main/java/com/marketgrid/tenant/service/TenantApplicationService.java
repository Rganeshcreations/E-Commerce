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
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate;
    private final String provisioningSecret;

    public TenantApplicationService(TenantApplicationRepository applicationRepository,
            TenantService tenantService, BusinessDomainRepository domainRepository,
            PasswordEncoder passwordEncoder, RestTemplate restTemplate,
            @Value("${app.internal.provisioning-secret:}") String provisioningSecret) {
        this.applicationRepository = applicationRepository;
        this.tenantService = tenantService;
        this.domainRepository = domainRepository;
        this.passwordEncoder = passwordEncoder;
        this.restTemplate = restTemplate;
        this.provisioningSecret = provisioningSecret;
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

        // Create the Tenant Admin account through the User Service, which owns user_db.
        // Never write directly into another microservice's database.
        if (provisioningSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Internal account provisioning is not configured");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-MarketGrid-Service-Secret", provisioningSecret);
        ProvisionTenantAdminRequest account = new ProvisionTenantAdminRequest(
                tenant.getId(), application.getApplicantName(), application.getApplicantEmail(),
                application.getApplicantPasswordHash(), "TENANT_ADMIN");
        try {
            restTemplate.postForEntity("http://user-service/internal/provisioning/accounts",
                    new HttpEntity<>(account, headers), String.class);
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Tenant was not approved because the login account could not be provisioned");
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

    public static class ProvisionTenantAdminRequest {
        private final Long tenantId;
        private final String fullName;
        private final String email;
        private final String passwordHash;
        private final String role;
        public ProvisionTenantAdminRequest(Long tenantId, String fullName, String email,
                String passwordHash, String role) {
            this.tenantId = tenantId;
            this.fullName = fullName;
            this.email = email;
            this.passwordHash = passwordHash;
            this.role = role;
        }
        public Long getTenantId() { return tenantId; }
        public String getFullName() { return fullName; }
        public String getEmail() { return email; }
        public String getPasswordHash() { return passwordHash; }
        public String getRole() { return role; }
    }

    private TenantApplication findPending(Long applicationId) {
        TenantApplication application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new TenantNotFoundException("Tenant application not found"));
        if (application.getStatus() != TenantApplication.Status.PENDING)
            throw new IllegalArgumentException("Only pending applications can be reviewed");
        return application;
    }
}
