package com.marketgrid.vendor.controller;

import com.marketgrid.vendor.entity.Vendor;
import com.marketgrid.vendor.service.VendorService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
public class VendorController {

    private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @GetMapping("/me")
    public ResponseEntity<Vendor> getCurrentVendor(Authentication authentication) {
        return ResponseEntity.ok(
                vendorService.getByEmailAndTenant(authentication.getName())
        );
    }

    @PostMapping
    public ResponseEntity<Vendor> createVendor(
            @RequestBody Vendor vendor) {

        return ResponseEntity.ok(
                vendorService.createVendor(vendor)
        );
    }

    @GetMapping
    public ResponseEntity<List<Vendor>> getAllVendors() {

        return ResponseEntity.ok(
                vendorService.getAllVendors()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vendor> getVendorById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                vendorService.getVendorById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vendor> updateVendor(
            @PathVariable Long id,
            @RequestBody Vendor vendor) {

        return ResponseEntity.ok(
                vendorService.updateVendor(id, vendor)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVendor(
            @PathVariable Long id) {

        vendorService.deleteVendor(id);

        return ResponseEntity.noContent().build();
    }
}
