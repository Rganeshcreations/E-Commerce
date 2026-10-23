package com.marketgrid.product.service;
import com.marketgrid.product.entity.Product;
import com.marketgrid.product.repository.ProductRepository;
import com.marketgrid.product.security.TenantContext;
import org.springframework.stereotype.Service;
import java.util.List;
@Service
public class ProductService {
    private final ProductRepository productRepository;
    public ProductService(ProductRepository productRepository){this.productRepository=productRepository;}
    public Product createProduct(Product product){Long tenantId=TenantContext.getTenantId();if(tenantId==null)throw new RuntimeException("Tenant information not found");product.setTenantId(tenantId);return productRepository.save(product);}
    public List<Product> getAllProducts(){Long tenantId=TenantContext.getTenantId();if(tenantId==null)throw new RuntimeException("Tenant information not found");return productRepository.findAllByTenantId(tenantId);}
    public List<Product> getProductsByVendor(Long vendorId){Long tenantId=TenantContext.getTenantId();if(tenantId==null)throw new RuntimeException("Tenant information not found");return productRepository.findAllByTenantIdAndVendorId(tenantId,vendorId);}
    public Product getProductById(Long id){return productRepository.findByIdAndTenantId(id,TenantContext.getTenantId()).orElseThrow(()->new RuntimeException("Product not found"));}
    public Product updateProduct(Long id,Product updatedProduct){Product product=productRepository.findByIdAndTenantId(id,TenantContext.getTenantId()).orElseThrow(()->new RuntimeException("Product not found"));product.setProductName(updatedProduct.getProductName());product.setDescription(updatedProduct.getDescription());product.setPrice(updatedProduct.getPrice());product.setStockQuantity(updatedProduct.getStockQuantity());product.setStatus(updatedProduct.getStatus());return productRepository.save(product);}
    public void deleteProduct(Long id){Product product=productRepository.findByIdAndTenantId(id,TenantContext.getTenantId()).orElseThrow(()->new RuntimeException("Product not found"));productRepository.delete(product);}
    public Product reduceStock(Long id,Integer quantity){Long tenantId=TenantContext.getTenantId();if(tenantId==null)throw new RuntimeException("Tenant information not found");if(quantity==null||quantity<=0)throw new RuntimeException("Quantity must be greater than zero");Product product=productRepository.findByIdAndTenantId(id,tenantId).orElseThrow(()->new RuntimeException("Product not found"));if(product.getStockQuantity()<quantity)throw new RuntimeException("Insufficient stock for product: "+product.getProductName());product.setStockQuantity(product.getStockQuantity()-quantity);return productRepository.save(product);}
}
