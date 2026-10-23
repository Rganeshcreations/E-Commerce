package com.marketgrid.product.controller;
import com.marketgrid.product.entity.Product;
import com.marketgrid.product.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService productService;
    public ProductController(ProductService productService){this.productService=productService;}
    @PostMapping public ResponseEntity<Product> createProduct(@RequestBody Product product){return ResponseEntity.ok(productService.createProduct(product));}
    @GetMapping public ResponseEntity<List<Product>> getAllProducts(){return ResponseEntity.ok(productService.getAllProducts());}
    @GetMapping("/vendor/{vendorId}") public ResponseEntity<List<Product>> getProductsByVendor(@PathVariable Long vendorId){return ResponseEntity.ok(productService.getProductsByVendor(vendorId));}
    @GetMapping("/{id}") public ResponseEntity<Product> getProductById(@PathVariable Long id){return ResponseEntity.ok(productService.getProductById(id));}
    @PutMapping("/{id}") public ResponseEntity<Product> updateProduct(@PathVariable Long id,@RequestBody Product product){return ResponseEntity.ok(productService.updateProduct(id,product));}
    @DeleteMapping("/{id}") public ResponseEntity<Void> deleteProduct(@PathVariable Long id){productService.deleteProduct(id);return ResponseEntity.noContent().build();}
    @PatchMapping("/{id}/stock") public ResponseEntity<Product> reduceStock(@PathVariable Long id,@RequestParam Integer quantity){return ResponseEntity.ok(productService.reduceStock(id,quantity));}
}
