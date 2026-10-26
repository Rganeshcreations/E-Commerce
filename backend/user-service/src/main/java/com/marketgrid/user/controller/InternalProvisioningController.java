package com.marketgrid.user.controller;

import com.marketgrid.user.dto.InternalProvisioningRequest;
import com.marketgrid.user.entity.User;
import com.marketgrid.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.Set;

/**
 * Private service-to-service account provisioning endpoint.
 * Do not expose this path through the public API Gateway.
 */
@RestController
@RequestMapping("/internal/provisioning")
public class InternalProvisioningController {
    private static final Set<String> ALLOWED_ROLES = Set.of("TENANT_ADMIN", "VENDOR");

    private final UserRepository userRepository;
    private final String sharedSecret;

    public InternalProvisioningController(
            UserRepository userRepository,
            @Value("${app.internal.provisioning-secret:}") String sharedSecret) {
        this.userRepository = userRepository;
        this.sharedSecret = sharedSecret;
    }

    @PostMapping("/accounts")
    public ResponseEntity<ProvisioningResponse> provision(
            @RequestHeader(value = "X-MarketGrid-Service-Secret", required = false) String suppliedSecret,
            @RequestBody InternalProvisioningRequest request) {
        if (sharedSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Internal account provisioning is not configured");
        }
        if (suppliedSecret == null || !MessageDigest.isEqual(
                sharedSecret.getBytes(StandardCharsets.UTF_8),
                suppliedSecret.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Service authentication failed");
        }
        if (request == null || request.getTenantId() == null || request.getTenantId() <= 0
                || request.getFullName() == null || request.getFullName().trim().length() < 2
                || request.getFullName().trim().length() > 120
                || request.getEmail() == null
                || !request.getEmail().trim().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
                || request.getPasswordHash() == null
                || !request.getPasswordHash().matches("^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid provisioning details");
        }

        String role = request.getRole() == null ? "" : request.getRole().trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_ROLES.contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only approved tenant-admin or vendor roles can be provisioned");
        }

        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmailAndTenantId(email, request.getTenantId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An account with this email already exists in this store");
        }

        User user = new User();
        user.setTenantId(request.getTenantId());
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        // This endpoint accepts only a validated BCrypt hash; never encode it again.
        user.setPassword(request.getPasswordHash());
        user.setRole(role);
        user.setActive(true);
        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ProvisioningResponse(saved.getId(), saved.getTenantId(), saved.getEmail(), saved.getRole()));
    }

    /**
     * Promote an existing applicant account after the Tenant Service approves its application.
     * This updates the existing row and never creates a second login account.
     */
    @PostMapping("/accounts/{userId}/promote")
    public ResponseEntity<ProvisioningResponse> promoteApplicant(
            @RequestHeader(value = "X-MarketGrid-Service-Secret", required = false) String suppliedSecret,
            @PathVariable Long userId,
            @RequestBody PromotionRequest request) {
        if (sharedSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Internal account provisioning is not configured");
        }
        if (suppliedSecret == null || !MessageDigest.isEqual(
                sharedSecret.getBytes(StandardCharsets.UTF_8),
                suppliedSecret.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Service authentication failed");
        }
        if (request == null || request.getTenantId() == null || request.getTenantId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid tenant ID is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Applicant account not found"));

        if ("TENANT_ADMIN".equals(user.getRole()) && request.getTenantId().equals(user.getTenantId())) {
            return ResponseEntity.ok(new ProvisioningResponse(
                    user.getId(), user.getTenantId(), user.getEmail(), user.getRole()));
        }
        if (!"TENANT_APPLICANT".equals(user.getRole()) || user.getTenantId() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only an unassigned tenant applicant can be promoted");
        }

        user.setTenantId(request.getTenantId());
        user.setRole("TENANT_ADMIN");
        User saved = userRepository.save(user);
        return ResponseEntity.ok(new ProvisioningResponse(
                saved.getId(), saved.getTenantId(), saved.getEmail(), saved.getRole()));
    }

    public static class PromotionRequest {
        private Long tenantId;
        public PromotionRequest() {}
        public Long getTenantId() { return tenantId; }
        public void setTenantId(Long tenantId) { this.tenantId = tenantId; }
    }

    public static class ProvisioningResponse {
        private final Long userId;
        private final Long tenantId;
        private final String email;
        private final String role;
        public ProvisioningResponse(Long userId, Long tenantId, String email, String role) {
            this.userId = userId;
            this.tenantId = tenantId;
            this.email = email;
            this.role = role;
        }
        public Long getUserId() { return userId; }
        public Long getTenantId() { return tenantId; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
    }
}
