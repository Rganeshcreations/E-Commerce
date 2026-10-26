package com.marketgrid.payment.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

@Component
public class OrderClient {

    private final RestClient restClient;

    public OrderClient() {
        this.restClient = RestClient.builder()
                .baseUrl("http://localhost:8084")
                .build();
    }

    public OrderResponse getOrder(Long orderId, String authorizationHeader) {
        return restClient.get()
                .uri("/api/orders/{id}", orderId)
                .header("Authorization", authorizationHeader)
                .retrieve()
                .body(OrderResponse.class);
    }

    public record OrderResponse(
            Long id,
            Long tenantId,
            Long customerId,
            BigDecimal totalAmount,
            String status
    ) {
    }
}
