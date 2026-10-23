package com.marketgrid.order.controller;

import com.marketgrid.order.entity.Order;
import com.marketgrid.order.service.OrderService;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public Order createOrder(
            @RequestBody Order order,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {

        return orderService.createOrder(order, token);
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public Order getOrder(@PathVariable Long id) {
        return orderService.getOrder(id);
    }

    @PatchMapping("/{id}/status")
    public Order updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return orderService.updateStatus(id, status);
    }
}
