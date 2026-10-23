package com.marketgrid.payment.controller;

import com.marketgrid.payment.entity.Payment;
import com.marketgrid.payment.dto.PaymentRequest;
import com.marketgrid.payment.service.PaymentService;
import com.marketgrid.payment.security.TenantContext;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public Payment createPayment(
            @RequestBody PaymentRequest request) {

        Long tenantId = TenantContext.getTenantId();

        return paymentService.createPayment(
                request,
                tenantId
        );
    }

    @GetMapping
    public List<Payment> getAllPayments() {

        Long tenantId = TenantContext.getTenantId();

        return paymentService.getAllPayments(
                tenantId
        );
    }

    @GetMapping("/{id}")
    public Payment getPayment(
            @PathVariable Long id) {

        Long tenantId = TenantContext.getTenantId();

        return paymentService.getPayment(
                id,
                tenantId
        );
    }

    @GetMapping("/order/{orderId}")
    public Payment getPaymentByOrder(
            @PathVariable Long orderId) {

        Long tenantId = TenantContext.getTenantId();

        return paymentService.getPaymentByOrder(
                orderId,
                tenantId
        );
    }
}
