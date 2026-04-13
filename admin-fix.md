# Detailed Admin & System Fix Plan (admin-fix)

This document outlines the 100% detailed implementation steps to resolve the reported issues and enhance the Admin Dashboard.

## 1. Admin Financial Management (Withdrawal & Bank Setup)

### Current Issue
Admin bank details are hard to manage after the first entry, and the withdrawal flow is not intuitive.

### Detailed Actions
- **Redesign Finances Tab (`web-app/src/app/admin/page.tsx`)**:
    - Replace the conditional rendering of the bank form with a **Status Card**.
    - If `adminUser.bankDetails.accountNumber` exists:
        - Show: "Payout Bank: [Bank Name] | [Account Number] | [Account Name]".
        - Add an "**Edit Payout Account**" button which resets the local state to show the entry form.
    - Improve the **Withdrawal Button**:
        - Move it to a more prominent position in the financial summary.
        - Add a tooltip or helper text explaining that a Transaction PIN is required.

---

## 2. API Consistency & AI Matcher Fix (Mobile)

### Current Issue
Mobile app calls singular `/wallet` instead of plural `/wallets` and the wrong `/match` endpoint.

### Detailed Actions
- **Update `mobile/services/api.ts`**:
    - **Match API**: Change `api.post('/match', ...)` to `api.post('/match/request', ...)`.
    - **Wallet API**: Rename all singular `/wallet` paths to `/wallets` (plural) across all functions (`getWallet`, `initializePayment`, etc.).
    - **Bank API**: Rename `/wallet/banks` to `/wallets/banks` and `/wallet/verify-account` to `/wallets/verify-account`.
- **Update `mobile/app/(tabs)/ai-match.tsx`**:
    - Ensure the match score and reasoning are handled correctly from the dynamic response.

---

## 3. Global System Settings Enforcement

### Current Issue
Global settings (like Max Hourly Rate) are not being enforced during tutor profile updates.

### Detailed Actions
- **Backend Enforcement (`backend/src/controllers/userController.ts`)**:
    - In `updateProfile`, add a check:
        ```typescript
        if (req.body.hourlyRate) {
            const settings = await Settings.findOne();
            if (settings && req.body.hourlyRate > settings.maxHourlyRate) {
                return res.status(400).json({ message: `Max allowed rate is ₦${settings.maxHourlyRate}` });
            }
        }
        ```
- **Frontend Feedback (`web-app/src/app/profile/edit/page.tsx`)**:
    - Fetch settings on page load.
    - Display a small helper text below the "Hourly Rate" input: *"System maximum: ₦[maxRate]"*.

---

## 4. Admin Messaging System

### Current Issue
Admins cannot contact users directly from the dashboard.

### Detailed Actions
- **Update Admin Control Panel (`web-app/src/app/admin/page.tsx`)**:
    - **User Table**: Add an "Actions" column or update the existing one with a "✉️ Message" button.
    - **Messaging Modal**:
        - Create a state variable `showMsgModal` and `selectedUserForMsg`.
        - Implement a modal with a `textarea`.
        - Call `messageApi.sendMessage(userId, content)` on submit.
        - Show a success alert and close the modal.

---

## 5. AI Recommendation Reliability

### Current Issue
404 errors and potential AI processing failures.

### Detailed Actions
- **Backend Fix (`backend/src/controllers/matchController.ts`)**:
    - Ensure the controller handles cases where the OpenAI/Gemini API key might be missing or limited by providing a fallback matching algorithm based on course code overlap.
    - Verify that the `/api/match/request` route is properly registered in `server.ts`.

## Verification Checklist
- [ ] Admin Bank details can be edited after being saved.
- [ ] Admin withdrawal modal works with Transaction PIN.
- [ ] Mobile app no longer reports 404 for wallet/banks.
- [ ] Mobile AI Matcher successfully returns a tutor.
- [ ] Tutors are blocked from setting a rate above the Max Hourly Rate.
- [ ] Admin can send a message to any user from the User Management tab.
