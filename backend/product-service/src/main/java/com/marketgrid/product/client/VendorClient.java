package com.marketgrid.product.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class VendorClient {

    private final RestClient restClient;

    public VendorClient() {
        this.restClient = RestClient.builder()
                .baseUrl("http://localhost:8082")
                .build();
    }

    public VendorResponse getCurrentVendor(String authorizationHeader) {
        return restClient.get()
                .uri("/api/vendors/me")
                .header("Authorization", authorizationHeader)
                .retrieve()
                .body(VendorResponse.class);
    }

    public VendorResponse getVendor(Long vendorId, String authorizationHeader) {
        return restClient.get()
                .uri("/api/vendors/{id}", vendorId)
                .header("Authorization", authorizationHeader)
                .retrieve()
                .body(VendorResponse.class);
    }

    public record VendorResponse(Long id, Long tenantId, String email, String status) {
    }
}
