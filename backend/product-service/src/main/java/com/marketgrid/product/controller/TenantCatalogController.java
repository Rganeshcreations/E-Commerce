package com.marketgrid.product.controller;

import com.marketgrid.product.entity.Product;
import com.marketgrid.product.entity.TenantCatalogProduct;
import com.marketgrid.product.service.TenantCatalogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/catalog")
public class TenantCatalogController {
    private final TenantCatalogService service;

    public TenantCatalogController(TenantCatalogService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<TenantCatalogProduct>> listCatalog(HttpServletRequest request) {
        return ResponseEntity.ok(service.listCatalog(request.getHeader("Authorization")));
    }

    @PostMapping
    public ResponseEntity<TenantCatalogProduct> create(
            @RequestBody TenantCatalogProduct product) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createCatalogProduct(product));
    }

    @PostMapping("/{catalogId}/allocate")
    public ResponseEntity<Product> allocate(
            @PathVariable Long catalogId,
            @RequestBody TenantCatalogService.AllocationRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.allocateToVendor(catalogId, request, httpRequest.getHeader("Authorization")));
    }
}
