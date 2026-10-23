package com.marketgrid.order.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class VendorClient {

    private final RestClient restClient;

    public VendorClient() {
        this.restClient = RestClient.builder()
                .baseUrl("http://localhost:8082")
                .build();
    }

    public VendorResponse getVendorByEmail(
            String email,
            String token) {

        List<VendorResponse> vendors = restClient.get()
                .uri("/api/vendors")
                .header("Authorization", token)
                .retrieve()
                .body(new org.springframework.core.ParameterizedTypeReference<List<VendorResponse>>() {});

        if (vendors == null) {
            throw new RuntimeException("Vendor information not found");
        }

        return vendors.stream()
                .filter(v -> email.equalsIgnoreCase(v.email()))
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException("Vendor not found for logged-in user"));
    }

    public record VendorResponse(
            Long id,
            Long tenantId,
            String vendorName,
            String email,
            String phone,
            String businessName,
            String status,
            java.time.LocalDateTime createdAt
    ) {
    }
}
