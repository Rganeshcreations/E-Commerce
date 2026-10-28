package com.marketgrid.vendor.controller;

import com.marketgrid.vendor.service.VendorRegistrationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/vendors")
public class VendorRegistrationController {

    private final VendorRegistrationService registrationService;

    public VendorRegistrationController(VendorRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @RequestBody RegistrationRequest request) {

        Map<String, Object> result = registrationService.register(
                request.fullName(),
                request.email(),
                request.password(),
                request.tenantSlug(),
                request.businessName());

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    public record RegistrationRequest(
            String fullName,
            String email,
            String password,
            String tenantSlug,
            String businessName) {
    }
}