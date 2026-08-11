# Zigo Admin Subscription Management & Operations Guide

This guide details the operation of the Platform Admin Subscription State Dashboard (`/admin`), subscription lifecycle management, and manual override procedures.

---

## 1. Subscription Models & Core Engine Rules

1. **No Ads Policy**:
   - Zigo features zero AdMob / ad-reward monetization. All monetization runs through Zigo Plus subscriptions and 30-day trials.

2. **30-Day Free Trial**:
   - Every registered user automatically receives 30 days of full-featured free trial upon account creation.

3. **Dynamic Pricing Engine**:
   - Users converting to Zigo Plus **within the first 30 days** receive a **50% discount**.
   - Users converting **after 30 days** pay standard full list price (**0% discount**).

4. **Supported Roles**:
   - `STUDENT`, `TEACHER`, `PARENT`, `EDUCATION_INSTITUTION`, `EDUCATION_PLATFORM`, `PUBLISHER`.

---

## 2. Admin Operations & Audit Logging

- **Role Change Requests**:
  - Managed via `/admin/role-requests`.
  - Admin approval calls `approve_role_change_request` RPC after verifying payment or manual waiver.

- **Subscription State Override**:
  - Admins can override tier status to `free` or `zigo_plus` directly from `/admin`.
  - All admin subscription modifications trigger `admin_billing_grants` audit logging.

- **Audit Trail**:
  - Records: `admin_id`, `target_user_id`, `tier`, `duration_days`, `note`, `timestamp`.
  - Accessible in `/admin` under the **Denetim İzi (Audit Trail)** panel.
