package com.marketgrid.vendor.controller;

import com.marketgrid.vendor.entity.VendorApplication;
import com.marketgrid.vendor.service.VendorApplicationService;
import com.marketgrid.vendor.service.VendorApplicationService.SubmitRequest;
import com.marketgrid.vendor.service.VendorApplicationService.ReviewRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vendors/applications")
public class VendorApplicationController {
    private final VendorApplicationService service;
    public VendorApplicationController(VendorApplicationService service){this.service=service;}
    @PostMapping public ResponseEntity<VendorApplication> submit(@RequestBody SubmitRequest r){return ResponseEntity.status(HttpStatus.CREATED).body(service.submit(r));}
    @GetMapping public ResponseEntity<List<VendorApplication>> list(){return ResponseEntity.ok(service.list(false));}
    @GetMapping("/pending") public ResponseEntity<List<VendorApplication>> pending(){return ResponseEntity.ok(service.list(true));}
    @PostMapping("/{id}/approve") public ResponseEntity<VendorApplication> approve(@PathVariable Long id,@RequestBody(required=false) ReviewRequest r,@RequestHeader("Authorization") String authorization){return ResponseEntity.ok(service.approve(id,r,authorization));}
    @PostMapping("/{id}/reject") public ResponseEntity<VendorApplication> reject(@PathVariable Long id,@RequestBody ReviewRequest r){return ResponseEntity.ok(service.reject(id,r));}
}