package com.marketgrid.product.controller;

import com.marketgrid.product.entity.Product;
import com.marketgrid.product.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(
            @RequestBody Product product, HttpServletRequest request) {
        return ResponseEntity.ok(productService.createProduct(product, request.getHeader("Authorization")));
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(HttpServletRequest request) {
        return ResponseEntity.ok(productService.getAllProducts(request.getHeader("Authorization")));
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<Product>> getProductsByVendor(
            @PathVariable Long vendorId, HttpServletRequest request) {
        return ResponseEntity.ok(productService.getProductsByVendor(vendorId, request.getHeader("Authorization")));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(
            @PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(productService.getProductById(id, request.getHeader("Authorization")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id, @RequestBody Product product, HttpServletRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, product, request.getHeader("Authorization")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id, HttpServletRequest request) {
        productService.deleteProduct(id, request.getHeader("Authorization"));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<Product> reduceStock(
            @PathVariable Long id, @RequestParam Integer quantity) {
        return ResponseEntity.ok(productService.reduceStock(id, quantity));
    }
}
