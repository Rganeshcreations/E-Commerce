package com.marketgrid.tenant.controller;

import com.marketgrid.tenant.dto.TenantResponse;
import com.marketgrid.tenant.repository.TenantRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/public/tenants")
public class PublicTenantController {
    private final TenantRepository tenantRepository;
    public PublicTenantController(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }
    @GetMapping
    public List<TenantResponse> getActiveTenants() {
        return tenantRepository.findAll().stream()
            .filter(tenant -> tenant.isActive())
            .map(TenantResponse::new)
            .toList();
    }
}