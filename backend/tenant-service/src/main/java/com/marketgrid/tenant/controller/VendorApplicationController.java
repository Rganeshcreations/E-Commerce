package com.marketgrid.tenant.controller;

import com.marketgrid.tenant.dto.SubmitVendorApplicationRequest;
import com.marketgrid.tenant.entity.VendorApplication;
import com.marketgrid.tenant.repository.TenantRepository;
import com.marketgrid.tenant.repository.VendorApplicationRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor-applications")
public class VendorApplicationController {
    private final VendorApplicationRepository applications;
    private final TenantRepository tenants;
    private final PasswordEncoder passwordEncoder;

    public VendorApplicationController(VendorApplicationRepository applications, TenantRepository tenants,
            PasswordEncoder passwordEncoder) {
        this.applications = applications;
        this.tenants = tenants;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> submit(@Valid @RequestBody SubmitVendorApplicationRequest request) {
        String email = request.getApplicantEmail().trim().toLowerCase(Locale.ROOT);
        String slug = request.getTenantSlug().trim().toLowerCase(Locale.ROOT);
        boolean activeTenant = tenants.findBySlug(slug)
            .filter(t -> t.isActive()).isPresent();
        if (!activeTenant) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Active store not found");
        }
        if (applications.existsByApplicantEmailAndTenantSlugAndStatus(
                email, slug, VendorApplication.Status.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "You already have a pending vendor application for this store");
        }
        VendorApplication application = new VendorApplication();
        application.setApplicantName(request.getApplicantName().trim());
        application.setApplicantEmail(email);
        application.setTenantSlug(slug);
        application.setBusinessName(request.getBusinessName().trim());
        application.setApplicantPasswordHash(passwordEncoder.encode(request.getPassword()));
        application.setStatus(VendorApplication.Status.PENDING);
        VendorApplication saved = applications.save(application);
        return Map.of("id", saved.getId(), "status", saved.getStatus().name(),
            "message", "Application submitted. Store administrator review and account provisioning are still required.");
    }
}