package com.marketgrid.payment.controller;

import com.marketgrid.payment.dto.PaymentRequest;
import com.marketgrid.payment.entity.Payment;
import com.marketgrid.payment.security.JwtUtil;
import com.marketgrid.payment.security.TenantContext;
import com.marketgrid.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final JwtUtil jwtUtil;

    public PaymentController(PaymentService paymentService, JwtUtil jwtUtil) {
        this.paymentService = paymentService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public Payment createPayment(
            @RequestBody PaymentRequest request,
            HttpServletRequest httpRequest) {

        String authorization = httpRequest.getHeader("Authorization");
        String token = authorization != null && authorization.startsWith("Bearer ")
                ? authorization.substring(7)
                : "";

        return paymentService.createPayment(
                request,
                TenantContext.getTenantId(),
                jwtUtil.extractUserId(token),
                jwtUtil.extractRole(token),
                authorization
        );
    }

    @GetMapping
    public List<Payment> getAllPayments() {
        return paymentService.getAllPayments(TenantContext.getTenantId());
    }

    @GetMapping("/{id}")
    public Payment getPayment(@PathVariable Long id) {
        return paymentService.getPayment(id, TenantContext.getTenantId());
    }

    @GetMapping("/order/{orderId}")
    public Payment getPaymentByOrder(@PathVariable Long orderId) {
        return paymentService.getPaymentByOrder(orderId, TenantContext.getTenantId());
    }
}
