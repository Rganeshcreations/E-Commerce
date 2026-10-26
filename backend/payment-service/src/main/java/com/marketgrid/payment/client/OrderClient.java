package com.marketgrid.payment.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;

@Component
public class OrderClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String orderServiceUrl;

    public OrderClient(
            @Value("${app.services.order-url:http://localhost:8084}") String orderServiceUrl) {
        this.orderServiceUrl = orderServiceUrl.replaceAll("/+$", "");
    }

    public OrderSnapshot getOrder(Long orderId, String authorizationHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));

        try {
            ResponseEntity<OrderSnapshot> response = restTemplate.exchange(
                    orderServiceUrl + "/api/orders/" + orderId,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    OrderSnapshot.class
            );

            OrderSnapshot order = response.getBody();
            if (order == null || order.id() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Order could not be verified for payment"
                );
            }
            return order;
        } catch (HttpStatusCodeException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Order could not be verified for payment"
            );
        } catch (ResourceAccessException ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Order service is unavailable; payment was not created"
            );
        }
    }

    public record OrderSnapshot(
            Long id,
            Long tenantId,
            Long customerId,
            BigDecimal totalAmount,
            String status
    ) {}
}
