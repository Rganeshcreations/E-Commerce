package com.marketgrid.vendor.service;

import com.marketgrid.vendor.entity.Vendor;
import com.marketgrid.vendor.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class VendorRegistrationService {

    private final VendorRepository vendors;
    private final RestClient restClient = RestClient.create();
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${app.internal.provisioning-secret:}")
    private String provisioningSecret;

    public VendorRegistrationService(VendorRepository vendors) {
        this.vendors = vendors;
    }

    @Transactional
    public Map<String, Object> register(
            String fullName,
            String email,
            String password,
            String tenantSlug,
            String businessName) {

        if (blank(fullName) || blank(email) || blank(password)
                || blank(tenantSlug) || blank(businessName)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "All registration fields are required.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (password.length() < 8 || password.length() > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Password must contain 8 to 72 characters.");
        }

        if (provisioningSecret == null || provisioningSecret.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Internal provisioning secret is not configured.");
        }

        Map<?, ?> tenant;
        try {
            tenant = restClient.get()
                    .uri("http://localhost:8086/api/tenants/slug/{slug}", tenantSlug.trim())
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Could not verify the selected store. Check that Tenant Service is running and the store is active.");
        }

        if (tenant == null || tenant.get("id") == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Selected store was not found.");
        }

        Object activeValue = tenant.containsKey("active")
                ? tenant.get("active") : tenant.get("isActive");

        if (!Boolean.TRUE.equals(activeValue)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Selected store is not active.");
        }

        Long tenantId;
        try {
            tenantId = Long.valueOf(String.valueOf(tenant.get("id")));
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Tenant Service returned an invalid tenant ID.");
        }

        if (vendors.findByEmailAndTenantId(normalizedEmail, tenantId).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "A vendor with this email already exists for the selected store.");
        }

        Vendor vendor = new Vendor();
        vendor.setTenantId(tenantId);
        vendor.setVendorName(fullName.trim());
        vendor.setEmail(normalizedEmail);
        vendor.setBusinessName(businessName.trim());
        vendor.setStatus("ACTIVE");

        Vendor savedVendor;
        try {
            savedVendor = vendors.saveAndFlush(vendor);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This email may already be registered. Try another email address.");
        }

        Map<String, Object> userRequest = new HashMap<>();
        userRequest.put("fullName", fullName.trim());
        userRequest.put("email", normalizedEmail);
        userRequest.put("passwordHash", passwordEncoder.encode(password));
        userRequest.put("tenantId", tenantId);
        userRequest.put("role", "VENDOR");

        Map<?, ?> userResponse;
        try {
            userResponse = restClient.post()
                    .uri("http://localhost:8081/internal/provisioning/accounts")
                    .header("X-MarketGrid-Service-Secret", provisioningSecret)
                    .body(userRequest)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "User account creation failed. Check User Service logs and provisioning-secret configuration.");
        }

        if (userResponse == null
                || !"VENDOR".equals(String.valueOf(userResponse.get("role")))
                || !String.valueOf(tenantId).equals(String.valueOf(userResponse.get("tenantId")))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "User Service returned an unexpected account response.");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Vendor registered successfully. You can now log in.");
        result.put("vendorId", savedVendor.getId());
        result.put("userId", userResponse.get("userId"));
        result.put("tenantId", tenantId);
        result.put("email", normalizedEmail);
        result.put("role", "VENDOR");
        result.put("status", "ACTIVE");
        return result;
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}