package com.marketgrid.vendor.service;

import com.marketgrid.vendor.entity.Vendor;
import com.marketgrid.vendor.entity.VendorApplication;
import com.marketgrid.vendor.repository.VendorApplicationRepository;
import com.marketgrid.vendor.repository.VendorRepository;
import com.marketgrid.vendor.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class VendorApplicationService {
    private final VendorApplicationRepository applications;
    private final VendorRepository vendors;
    private final RestClient restClient=RestClient.create();
    public VendorApplicationService(VendorApplicationRepository applications, VendorRepository vendors){this.applications=applications;this.vendors=vendors;}

    @Transactional
    public VendorApplication submit(SubmitRequest r){
        if(r==null||blank(r.tenantSlug())||blank(r.applicantName())||blank(r.email())||blank(r.businessName()))
            throw new IllegalArgumentException("Name, email, business name and store slug are required");
        TenantLookup tenant;
        try { tenant=restClient.get().uri("http://localhost:8086/api/tenants/slug/{slug}",r.tenantSlug().trim()).retrieve().body(TenantLookup.class); }
        catch(RestClientException ex){throw new IllegalStateException("Unable to verify the selected store. Please try again.");}
        if(tenant==null||tenant.id()==null||!tenant.active()) throw new IllegalArgumentException("Selected store was not found or is inactive");
        String email=r.email().trim().toLowerCase(Locale.ROOT);
        if(applications.existsByTenantIdAndEmailAndStatus(tenant.id(),email,VendorApplication.Status.PENDING))
            throw new IllegalArgumentException("A pending application already exists for this email and store");
        VendorApplication a=new VendorApplication(); a.setTenantId(tenant.id()); a.setApplicantName(r.applicantName().trim()); a.setEmail(email); a.setBusinessName(r.businessName().trim());
        return applications.save(a);
    }
    public List<VendorApplication> list(boolean pending){
        Long tenant=requiredTenant();
        return pending?applications.findAllByTenantIdAndStatusOrderBySubmittedAtDesc(tenant,VendorApplication.Status.PENDING):applications.findAllByTenantIdOrderBySubmittedAtDesc(tenant);
    }
    @Transactional public VendorApplication approve(Long id, ReviewRequest r){
        Long tenant=requiredTenant();
        VendorApplication a=applications.findByIdAndTenantId(id,tenant).orElseThrow(()->new IllegalArgumentException("Application not found for this tenant"));
        ensurePending(a);
        if(vendors.findByEmailAndTenantId(a.getEmail(),tenant).isEmpty()){
            Vendor v=new Vendor(); v.setTenantId(tenant); v.setVendorName(a.getApplicantName()); v.setEmail(a.getEmail()); v.setBusinessName(a.getBusinessName()); v.setStatus("ACTIVE"); vendors.save(v);
        }
        a.setStatus(VendorApplication.Status.APPROVED); a.setReviewMessage(message(r,false)); a.setReviewedAt(LocalDateTime.now()); return applications.save(a);
    }
    @Transactional public VendorApplication reject(Long id, ReviewRequest r){
        Long tenant=requiredTenant(); VendorApplication a=applications.findByIdAndTenantId(id,tenant).orElseThrow(()->new IllegalArgumentException("Application not found for this tenant")); ensurePending(a);
        a.setStatus(VendorApplication.Status.REJECTED); a.setReviewMessage(message(r,true)); a.setReviewedAt(LocalDateTime.now()); return applications.save(a);
    }
    private static void ensurePending(VendorApplication a){if(a.getStatus()!=VendorApplication.Status.PENDING)throw new IllegalArgumentException("Only pending applications can be reviewed");}
    private Long requiredTenant(){Long id=TenantContext.getTenantId();if(id==null)throw new IllegalStateException("Tenant information not found in authentication token");return id;}
    private static boolean blank(String s){return s==null||s.isBlank();}
    private static String message(ReviewRequest r,boolean required){String s=r==null?null:r.message(); if(required&&blank(s))throw new IllegalArgumentException("A rejection message is required"); if(s!=null&&s.trim().length()>1000)throw new IllegalArgumentException("Review message must be 1000 characters or fewer");return blank(s)?null:s.trim();}
    public record SubmitRequest(String tenantSlug,String applicantName,String email,String businessName){}
    public record ReviewRequest(String message){}
    public record TenantLookup(Long id,String name,String slug,boolean active){}
}