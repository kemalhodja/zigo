package com.zigo.education.billing;

import android.app.Activity;
import androidx.annotation.NonNull;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
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
      PendingPurchasesParams pendingPurchasesParams = PendingPurchasesParams.newBuilder()
        .enableOneTimeProducts()
        .build();
      billingClient =
        BillingClient.newBuilder(getContext())
          .setListener(this)
          .enablePendingPurchases(pendingPurchasesParams)
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
            (billingResult, productDetailsResult) -> {
              if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject(billingResult.getDebugMessage());
                return;
              }

              List<ProductDetails> productDetailsList =
                productDetailsResult != null && productDetailsResult.getProductDetailsList() != null
                  ? productDetailsResult.getProductDetailsList()
                  : Collections.emptyList();

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

    List<String> candidateProductIds = new ArrayList<>();
    String[] defaults = new String[]{
      productId,
      planId,
      planId.replace("-", "_"),
      productId.replace("-", "_"),
      "zigo_plus",
      "zigo-plus",
      "zigo_plus_student_monthly",
      "zigo-plus-student-monthly",
      "zigo_plus_student_yearly",
      "zigo-plus-student-yearly",
      "zigo_plus_teachers_monthly",
      "zigo-plus-teachers-monthly",
      "zigo_plus_teachers_yearly",
      "zigo-plus-teachers-yearly",
      "zigo_plus_monthly",
      "zigo-plus-monthly",
      "zigo_plus_yearly",
      "zigo-plus-yearly",
      "student_monthly",
      "student_yearly",
      "teachers_monthly",
      "teachers_yearly",
      "monthly",
      "yearly"
    };
    for (String id : defaults) {
      if (id != null && !id.trim().isEmpty() && !candidateProductIds.contains(id.trim())) {
        candidateProductIds.add(id.trim());
      }
    }

    boolean isYearly = planId.toLowerCase().contains("yearly") || planId.toLowerCase().contains("yillik");

    List<QueryProductDetailsParams.Product> products = new ArrayList<>();
    for (String id : candidateProductIds) {
      products.add(
        QueryProductDetailsParams.Product.newBuilder()
          .setProductId(id)
          .setProductType(BillingClient.ProductType.SUBS)
          .build()
      );
    }

    ensureConnected(
      () ->
        getBillingClient()
          .queryProductDetailsAsync(
            QueryProductDetailsParams.newBuilder().setProductList(products).build(),
            (billingResult, productDetailsResult) -> {
              if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                rejectPendingPurchase("Google Play sorgu hatası (" + billingResult.getResponseCode() + "): " + billingResult.getDebugMessage());
                return;
              }

              List<ProductDetails> productDetailsList =
                productDetailsResult != null && productDetailsResult.getProductDetailsList() != null
                  ? productDetailsResult.getProductDetailsList()
                  : Collections.emptyList();

              if (productDetailsList.isEmpty()) {
                queryInAppFallback(candidateProductIds, planId, isYearly, call);
                return;
              }

              launchSubscriptionFlow(productDetailsList, candidateProductIds, planId, isYearly, call);
            }
          ),
      call
    );
  }

  private void launchSubscriptionFlow(
    List<ProductDetails> productDetailsList,
    List<String> candidateProductIds,
    String planId,
    boolean isYearly,
    PluginCall call
  ) {
    ProductDetails details = null;
    for (String candidate : candidateProductIds) {
      for (ProductDetails pd : productDetailsList) {
        if (candidate.equalsIgnoreCase(pd.getProductId())) {
          details = pd;
          break;
        }
      }
      if (details != null) break;
    }
    if (details == null && !productDetailsList.isEmpty()) {
      details = productDetailsList.get(0);
    }

    if (
      details == null ||
      details.getSubscriptionOfferDetails() == null ||
      details.getSubscriptionOfferDetails().isEmpty()
    ) {
      rejectPendingPurchase("Abonelik teklifi bulunamadı.");
      return;
    }

    String requestedOfferId = call.getString("offerToken");
    ProductDetails.SubscriptionOfferDetails selectedOffer = null;

    for (ProductDetails.SubscriptionOfferDetails offer : details.getSubscriptionOfferDetails()) {
      if (planId.equalsIgnoreCase(offer.getBasePlanId())) {
        if (requestedOfferId != null && !requestedOfferId.isEmpty() && requestedOfferId.equalsIgnoreCase(offer.getOfferId())) {
          selectedOffer = offer;
          break;
        }
      }
    }

    if (selectedOffer == null && requestedOfferId != null && !requestedOfferId.isEmpty()) {
      for (ProductDetails.SubscriptionOfferDetails offer : details.getSubscriptionOfferDetails()) {
        if (requestedOfferId.equalsIgnoreCase(offer.getOfferId())) {
          selectedOffer = offer;
          break;
        }
      }
    }

    if (selectedOffer == null) {
      for (ProductDetails.SubscriptionOfferDetails offer : details.getSubscriptionOfferDetails()) {
        if (planId.equalsIgnoreCase(offer.getBasePlanId())) {
          selectedOffer = offer;
          break;
        }
      }
    }

    if (selectedOffer == null) {
      for (ProductDetails.SubscriptionOfferDetails offer : details.getSubscriptionOfferDetails()) {
        String baseId = offer.getBasePlanId() != null ? offer.getBasePlanId().toLowerCase() : "";
        boolean matchesInterval = isYearly
          ? (baseId.contains("year") || baseId.contains("yil") || baseId.contains("p1y") || baseId.contains("annual"))
          : (baseId.contains("month") || baseId.contains("ay") || baseId.contains("p1m"));
        if (matchesInterval) {
          selectedOffer = offer;
          break;
        }
      }
    }

    if (selectedOffer == null && !details.getSubscriptionOfferDetails().isEmpty()) {
      selectedOffer = details.getSubscriptionOfferDetails().get(0);
    }

    if (selectedOffer == null) {
      rejectPendingPurchase("Seçilen abonelik planı (" + planId + ") için aktif teklif bulunamadı.");
      return;
    }

    String offerToken = selectedOffer.getOfferToken();
    BillingFlowParams.ProductDetailsParams productDetailsParams =
      BillingFlowParams.ProductDetailsParams.newBuilder()
        .setProductDetails(details)
        .setOfferToken(offerToken)
        .build();

    final String finalProductId = details.getProductId();

    Activity activity = getActivity();
    if (activity == null) {
      rejectPendingPurchase("Activity bulunamadı.");
      return;
    }

    activity.runOnUiThread(() -> {
      BillingResult launchResult =
        getBillingClient()
          .launchBillingFlow(
            activity,
            BillingFlowParams.newBuilder()
              .setProductDetailsParamsList(Collections.singletonList(productDetailsParams))
              .build()
          );

      if (launchResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
        if (launchResult.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
          resolveExistingPurchase(finalProductId, planId);
          return;
        }
        rejectPendingPurchase("Google Play ödeme penceresi açılamadı (" + launchResult.getResponseCode() + "): " + launchResult.getDebugMessage());
      }
    });
  }

  private void queryInAppFallback(
    List<String> candidateProductIds,
    String planId,
    boolean isYearly,
    PluginCall call
  ) {
    List<QueryProductDetailsParams.Product> inappProducts = new ArrayList<>();
    for (String id : candidateProductIds) {
      inappProducts.add(
        QueryProductDetailsParams.Product.newBuilder()
          .setProductId(id)
          .setProductType(BillingClient.ProductType.INAPP)
          .build()
      );
    }

    getBillingClient()
      .queryProductDetailsAsync(
        QueryProductDetailsParams.newBuilder().setProductList(inappProducts).build(),
        (inappBillingResult, inappProductDetailsResult) -> {
          List<ProductDetails> inappList =
            inappProductDetailsResult != null && inappProductDetailsResult.getProductDetailsList() != null
              ? inappProductDetailsResult.getProductDetailsList()
              : Collections.emptyList();

          if (inappList.isEmpty()) {
            rejectPendingPurchase("Google Play Console'da aktif abonelik ürünü bulunamadı (" + planId + "). Lütfen ürünün Play Console'da 'Etkin' (Active) durumda ve test kullanıcısının ekli olduğunu doğrulayın.");
            return;
          }

          ProductDetails inappDetails = inappList.get(0);
          BillingFlowParams.ProductDetailsParams inappParams =
            BillingFlowParams.ProductDetailsParams.newBuilder()
              .setProductDetails(inappDetails)
              .build();

          Activity activity = getActivity();
          if (activity == null) {
            rejectPendingPurchase("Activity bulunamadı.");
            return;
          }

          final String inappProdId = inappDetails.getProductId();

          activity.runOnUiThread(() -> {
            BillingResult launchResult =
              getBillingClient()
                .launchBillingFlow(
                  activity,
                  BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(inappParams))
                    .build()
                );

            if (launchResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
              if (launchResult.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
                resolveExistingPurchase(inappProdId, planId);
                return;
              }
              rejectPendingPurchase("Google Play ödeme penceresi açılamadı: " + launchResult.getDebugMessage());
            }
          });
        }
      );
  }

  @PluginMethod
  public void openSubscriptionsPage(PluginCall call) {
    try {
      android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
      intent.setData(android.net.Uri.parse("https://play.google.com/store/account/subscriptions?package=com.zigo.education"));
      intent.setPackage("com.android.vending");
      Activity activity = getActivity();
      if (activity != null) {
        activity.startActivity(intent);
        call.resolve();
      } else {
        call.reject("Activity bulunamadı");
      }
    } catch (Exception e) {
      try {
        android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
        intent.setData(android.net.Uri.parse("https://play.google.com/store/account/subscriptions?package=com.zigo.education"));
        getActivity().startActivity(intent);
        call.resolve();
      } catch (Exception ex) {
        call.reject("Google Play açılamadı: " + ex.getMessage());
      }
    }
  }

  @PluginMethod
  public void openPlayStoreApp(PluginCall call) {
    try {
      android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
      intent.setData(android.net.Uri.parse("market://details?id=com.zigo.education"));
      getActivity().startActivity(intent);
      call.resolve();
    } catch (Exception e) {
      try {
        android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
        intent.setData(android.net.Uri.parse("https://play.google.com/store/apps/details?id=com.zigo.education"));
        getActivity().startActivity(intent);
        call.resolve();
      } catch (Exception ex) {
        call.reject("Play Store açılamadı: " + ex.getMessage());
      }
    }
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

  private void resolveExistingPurchase(String productId, String planId) {
    getBillingClient().queryPurchasesAsync(
      QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(),
      (subResult, subPurchases) -> {
        if (subResult.getResponseCode() == BillingClient.BillingResponseCode.OK && subPurchases != null && !subPurchases.isEmpty()) {
          for (Purchase p : subPurchases) {
            if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
              acknowledgeIfNeeded(p);
              String resolvedProdId = p.getProducts().isEmpty() ? productId : p.getProducts().get(0);
              resolvePendingPurchase(resolvedProdId, p);
              return;
            }
          }
        }

        getBillingClient().queryPurchasesAsync(
          QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
          (inappResult, inappPurchases) -> {
            if (inappResult.getResponseCode() == BillingClient.BillingResponseCode.OK && inappPurchases != null && !inappPurchases.isEmpty()) {
              for (Purchase p : inappPurchases) {
                if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                  acknowledgeIfNeeded(p);
                  String resolvedProdId = p.getProducts().isEmpty() ? productId : p.getProducts().get(0);
                  resolvePendingPurchase(resolvedProdId, p);
                  return;
                }
              }
            }
            rejectPendingPurchase("Bu Google Play aboneliği hesabınızda zaten aktif ancak cihazda doğrulanamadı.");
          }
        );
      }
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

    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
      resolveExistingPurchase(pendingPlanId != null ? pendingPlanId : "zigo_plus", pendingPlanId);
      return;
    }

    if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null) {
      rejectPendingPurchase(billingResult.getDebugMessage());
      return;
    }

    for (Purchase purchase : purchases) {
      if (purchase.getProducts().isEmpty()) continue;
      if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
        acknowledgeIfNeeded(purchase);
      }
      resolvePendingPurchase(purchase.getProducts().get(0), purchase);
      return;
    }

    rejectPendingPurchase("Satın alma tamamlanamadı.");
  }

  private void acknowledgeIfNeeded(Purchase purchase) {
    if (purchase.isAcknowledged() || purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return;
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
    payload.put("packageName", purchase.getPackageName() == null ? "com.zigo.education" : purchase.getPackageName());
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
