# Security Specification: Veloura Secure Firestore Access Controls

## 1. Data Invariants
* **Invariant A (Video Access Rights)**: Only users with the `'admin'` role assigned in `/users/{userId}` can Create, Update, or Delete any record under the `/videos/{videoId}` collection.
* **Invariant B (Identity & Role Protection)**: No user is allowed to write or update their own `role` field directly in their `/users/{userId}` document to escalate privileges (e.g., from `'user'` to `'admin'`), unless they are authenticated and authorized under strict verification.
* **Invariant C (System-Generated Values)**: Field values like `views`, `likes`, `dislikes`, and `uploadDate` must either be validated against correct initial values on create, or restricted during manual updates to prevent arbitrary modifications by non-admins.
* **Invariant D (Secure Queries)**: Active video streams are read-accessible to any visitor, but disabled ones are restricted strictly to authenticated admins.

---

## 2. The "Dirty Dozen" Malicious Payloads
The following 12 payloads are designed to challenge and bypass standard permissions, and MUST return `PERMISSION_DENIED` during the security audit:

1. **Privilege Escalation Create**: A non-admin user attempts to self-provision a `/users/{uid}` document with `role: "admin"`.
2. **Privilege Escalation Update**: An existing authenticated user with `role: "user"` attempts to change their role to `role: "admin"`.
3. **Admin Identity Spoof**: A user attempts to create a video document claiming another admin's email or identity.
4. **Junk Video ID Injection**: A malicious client attempts to create a video document using a huge 5MB malicious string as the document ID (violating `.size() <= 128` constraint).
5. **Unauthorized Video Creation**: A non-admin user attempts to create a new record in the `/videos` collection.
6. **Unauthorized Video Editing**: A non-admin user attempts to edit a video title or description in `/videos/{videoId}`.
7. **Unauthorized Video Deletion**: A non-admin user attempts to delete a video document.
8. **Bypassing Video Active Restriction**: A non-admin user attempts to fetch or query inactive videos directly.
9. **Malicious View Count Hack**: A regular user attempts to edit a video document directly to set the `views` field to `999,999,999`.
10. **Malicious Reaction Hack**: A user attempts to update a video document directly to inject millions of fake likes.
11. **Client-Controlled Upload Date**: A user attempts to create a video document with an artificial `uploadDate` timestamp set in the far future (instead of using `serverTimestamp()`).
12. **Ghost Field Poisoning**: A user attempts to inject undocumented custom fields (e.g. `isVerifiedPartner: true`) during a video update.

---

## 3. Security Rules Test Configurations
The security rules test suite must assert that all above malicious payloads fail with a security violation exception. We write these assertions to keep our Zero-Trust architecture safe.
