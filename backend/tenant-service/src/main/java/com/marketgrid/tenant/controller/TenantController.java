package com.marketgrid.tenant.controller;

import com.marketgrid.tenant.dto.CreateTenantRequest;
import com.marketgrid.tenant.dto.TenantResponse;
import com.marketgrid.tenant.entity.Tenant;
import com.marketgrid.tenant.service.TenantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tenants")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TenantResponse create(
            @Valid @RequestBody CreateTenantRequest request) {
        return new TenantResponse(tenantService.create(request));
    }

    @GetMapping("/slug/{slug}")
    public TenantResponse getActiveBySlug(@PathVariable String slug) {
        return new TenantResponse(tenantService.getActiveBySlug(slug));
    }

    @GetMapping
    public List<TenantResponse> getAll() {
        return tenantService.getAll().stream()
            .map(TenantResponse::new)
            .toList();
    }

    @PatchMapping("/{id}/active")
    public TenantResponse setActive(
            @PathVariable Long id,
            @RequestParam boolean active) {
        return new TenantResponse(tenantService.setActive(id, active));
    }
}
