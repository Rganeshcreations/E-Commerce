package com.marketgrid.order.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ProductClient {

    private final RestClient restClient;

    public ProductClient() {
        this.restClient = RestClient.builder()
                .baseUrl("http://localhost:8083")
                .build();
    }

    public ProductResponse getProduct(Long productId, String token) {

        return restClient.get()
                .uri("/api/products/{id}", productId)
                .header("Authorization", token)
                .retrieve()
                .body(ProductResponse.class);
    }

    public ProductResponse reduceStock(
            Long productId,
            Integer quantity,
            String token) {

        return restClient.patch()
                .uri("/api/products/{id}/stock?quantity={quantity}",
                        productId,
                        quantity)
                .header("Authorization", token)
                .retrieve()
                .body(ProductResponse.class);
    }

    public record ProductResponse(
            Long id,
            Long tenantId,
            Long vendorId,
            String productName,
            String description,
            java.math.BigDecimal price,
            Integer stockQuantity,
            String status
    ) {
    }
}