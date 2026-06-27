package com.zigo.education.billing;

import android.app.Activity;
import androidx.annotation.NonNull;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "ZigoPlayBilling")
public class ZigoPlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {
  private BillingClient billingClient;
  private PluginCall pendingPurchaseCall;
  private String pendingPlanId;

  private BillingClient getBillingClient() {
    if (billingClient == null) {
      billingClient =
        BillingClient.newBuilder(getContext())
          .setListener(this)
          .enablePendingPurchases()
          .build();
    }
    return billingClient;
  }

  private void ensureConnected(Runnable onReady, PluginCall call) {
    BillingClient client = getBillingClient();
    if (client.isReady()) {
      onReady.run();
      return;
    }

    client.startConnection(
      new BillingClientStateListener() {
        @Override
        public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
          if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
            onReady.run();
          } else {
            call.reject("Google Play Billing bağlantısı kurulamadı: " + billingResult.getDebugMessage());
          }
        }

        @Override
        public void onBillingServiceDisconnected() {
          // Retry on next call.
        }
      }
    );
  }

  @PluginMethod
  public void getProducts(PluginCall call) {
    JSArray productIdsArray = call.getArray("productIds");
    if (productIdsArray == null || productIdsArray.length() == 0) {
      call.reject("productIds gerekli");
      return;
    }

    List<QueryProductDetailsParams.Product> products = new ArrayList<>();
    try {
      for (int i = 0; i < productIdsArray.length(); i++) {
        String productId = productIdsArray.getString(i);
        products.add(
          QueryProductDetailsParams.Product.newBuilder()
            .setProductId(productId)
            .setProductType(BillingClient.ProductType.SUBS)
            .build()
        );
      }
    } catch (Exception error) {
      call.reject("Geçersiz productIds");
      return;
    }

    ensureConnected(
      () ->
        getBillingClient()
          .queryProductDetailsAsync(
            QueryProductDetailsParams.newBuilder().setProductList(products).build(),
            (billingResult, productDetailsList) -> {
              if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject(billingResult.getDebugMessage());
                return;
              }

              JSArray result = new JSArray();
              for (ProductDetails details : productDetailsList) {
                JSObject item = new JSObject();
                item.put("productId", details.getProductId());
                item.put("title", details.getTitle());
                item.put("description", details.getDescription());
                String price = "";
                if (
                  details.getSubscriptionOfferDetails() != null &&
                  !details.getSubscriptionOfferDetails().isEmpty() &&
                  details
                    .getSubscriptionOfferDetails()
                    .get(0)
                    .getPricingPhases()
                    .getPricingPhaseList()
                    .size() >
                  0
                ) {
                  price =
                    details
                      .getSubscriptionOfferDetails()
                      .get(0)
                      .getPricingPhases()
                      .getPricingPhaseList()
                      .get(0)
                      .getFormattedPrice();
                }
                item.put("formattedPrice", price);
                result.put(item);
              }
              JSObject payload = new JSObject();
              payload.put("products", result);
              call.resolve(payload);
            }
          ),
      call
    );
  }

  @PluginMethod
  public void purchaseSubscription(PluginCall call) {
    String productId = call.getString("productId");
    String planId = call.getString("planId");
    if (productId == null || productId.isEmpty() || planId == null || planId.isEmpty()) {
      call.reject("productId ve planId gerekli");
      return;
    }

    pendingPurchaseCall = call;
    pendingPlanId = planId;

    List<QueryProductDetailsParams.Product> products = Collections.singletonList(
      QueryProductDetailsParams.Product.newBuilder()
        .setProductId(productId)
        .setProductType(BillingClient.ProductType.SUBS)
        .build()
    );

    ensureConnected(
      () ->
        getBillingClient()
          .queryProductDetailsAsync(
            QueryProductDetailsParams.newBuilder().setProductList(products).build(),
            (billingResult, productDetailsList) -> {
              if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                rejectPendingPurchase(billingResult.getDebugMessage());
                return;
              }
              if (productDetailsList.isEmpty()) {
                rejectPendingPurchase("Google Play ürünü bulunamadı: " + productId);
                return;
              }

              ProductDetails details = productDetailsList.get(0);
              if (
                details.getSubscriptionOfferDetails() == null ||
                details.getSubscriptionOfferDetails().isEmpty()
              ) {
                rejectPendingPurchase("Abonelik teklifi bulunamadı.");
                return;
              }

              String offerToken = details.getSubscriptionOfferDetails().get(0).getOfferToken();
              BillingFlowParams.ProductDetailsParams productDetailsParams =
                BillingFlowParams.ProductDetailsParams.newBuilder()
                  .setProductDetails(details)
                  .setOfferToken(offerToken)
                  .build();

              Activity activity = getActivity();
              if (activity == null) {
                rejectPendingPurchase("Activity bulunamadı.");
                return;
              }

              BillingResult launchResult =
                getBillingClient()
                  .launchBillingFlow(
                    activity,
                    BillingFlowParams.newBuilder()
                      .setProductDetailsParamsList(Collections.singletonList(productDetailsParams))
                      .build()
                  );

              if (launchResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                rejectPendingPurchase(launchResult.getDebugMessage());
              }
            }
          ),
      call
    );
  }

  @PluginMethod
  public void restorePurchases(PluginCall call) {
    ensureConnected(
      () ->
        getBillingClient()
          .queryPurchasesAsync(
            QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(),
            (billingResult, purchases) -> {
              if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject(billingResult.getDebugMessage());
                return;
              }

              JSArray restored = new JSArray();
              for (Purchase purchase : purchases) {
                if (purchase.getProducts().isEmpty()) continue;
                restored.put(buildPurchaseObject(purchase.getProducts().get(0), purchase, ""));
              }
              JSObject payload = new JSObject();
              payload.put("purchases", restored);
              call.resolve(payload);
            }
          ),
      call
    );
  }

  @Override
  public void onPurchasesUpdated(@NonNull BillingResult billingResult, List<Purchase> purchases) {
    if (pendingPurchaseCall == null) {
      return;
    }

    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
      rejectPendingPurchase("Satın alma iptal edildi.");
      return;
    }

    if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null) {
      rejectPendingPurchase(billingResult.getDebugMessage());
      return;
    }

    for (Purchase purchase : purchases) {
      if (purchase.getProducts().isEmpty()) continue;
      acknowledgeIfNeeded(purchase);
      resolvePendingPurchase(purchase.getProducts().get(0), purchase);
      return;
    }

    rejectPendingPurchase("Satın alma tamamlanamadı.");
  }

  private void acknowledgeIfNeeded(Purchase purchase) {
    if (purchase.isAcknowledged()) return;
    getBillingClient()
      .acknowledgePurchase(
        AcknowledgePurchaseParams.newBuilder().setPurchaseToken(purchase.getPurchaseToken()).build(),
        result -> {}
      );
  }

  private JSObject buildPurchaseObject(String productId, Purchase purchase, String planId) {
    JSObject payload = new JSObject();
    payload.put("productId", productId);
    payload.put("planId", planId);
    payload.put("purchaseToken", purchase.getPurchaseToken());
    payload.put("orderId", purchase.getOrderId() == null ? "" : purchase.getOrderId());
    payload.put("packageName", purchase.getPackageName());
    return payload;
  }

  private void resolvePendingPurchase(String productId, Purchase purchase) {
    if (pendingPurchaseCall == null) return;
    PluginCall call = pendingPurchaseCall;
    String planId = pendingPlanId == null ? "" : pendingPlanId;
    pendingPurchaseCall = null;
    pendingPlanId = null;
    call.resolve(buildPurchaseObject(productId, purchase, planId));
  }

  private void rejectPendingPurchase(String message) {
    if (pendingPurchaseCall == null) return;
    PluginCall call = pendingPurchaseCall;
    pendingPurchaseCall = null;
    pendingPlanId = null;
    call.reject(message);
  }
}
