# Audit Log - ГдеСейчас (EchoCity)

**Date Started:** 2025-11-14  
**Project:** EchoCity / ГдеСейчас  
**Location:** `C:\dev\echocity`

This log tracks issues found during audit and their resolutions.

---

## Audit Session: 2025-11-14

### Issues Found and Fixed

#### 1. Infrastructure Check
**Date:** 2025-11-14  
**Section:** 1. INFRA / SANE-СТАРТ

**Status:** ✅ VERIFIED
- Port 3010 configured correctly in `package.json`
- Dev server command: `npm run dev`
- Database connection verified (Supabase PostgreSQL)
- All migrations applied

**Action Taken:** None needed - all correct

---

#### 2. Authentication Implementation Discrepancy
**Date:** 2025-11-14  
**Section:** 2. АУТЕНТИФИКАЦИЯ

**Issue:** SPEC mentions NextAuth.js, but project uses custom authentication

**Finding:**
- Project uses custom session management via cookies (`modules/auth/session.ts`)
- No NextAuth.js dependency in `package.json`
- Custom implementation is simpler and functional

**Resolution:** 
- Documented in AUDIT_SPEC.md that custom auth is used
- This is acceptable - custom implementation works correctly

**Files:** 
- `modules/auth/session.ts`
- `package.json` (no next-auth dependency)

---

#### 3. Role Name Discrepancy
**Date:** 2025-11-14  
**Section:** 2. АУТЕНТИФИКАЦИЯ

**Issue:** SPEC mentions role `USER`, but project uses `CITIZEN`

**Finding:**
- Prisma schema has `CITIZEN` role, not `USER`
- All code uses `CITIZEN` consistently
- This appears intentional (more descriptive role name)

**Resolution:**
- Documented in AUDIT_SPEC.md
- No change needed - `CITIZEN` is more appropriate

**Files:**
- `prisma/schema.prisma` (Role enum)

---

#### 4. Missing Profile/Avatar Functionality
**Date:** 2025-11-14  
**Section:** 4. ПРОФИЛЬ, АВАТАР, ГАЛЕРЕЯ

**Issue:** Profile editing, avatar upload, and photo gallery not implemented

**Finding:**
- `/settings` page exists but is placeholder
- No `avatarUrl` field in UserProfile model
- No Supabase Storage integration
- No photo upload functionality

**Resolution:**
- Marked as NOT IMPLEMENTED in AUDIT_SPEC.md
- This is a known gap - to be implemented in future

**Files:**
- `app/settings/page.tsx` (placeholder)
- `prisma/schema.prisma` (UserProfile model - no avatarUrl)

**Action Required:** Future implementation needed

---

#### 5. Service Catalog Model Differences
**Date:** 2025-11-14  
**Section:** 6. КАТАЛОГ УСЛУГ

**Issue:** Model uses single `name` field instead of `nameRu`/`nameEn`

**Finding:**
- ServiceCategory and ServiceType use single `name` field
- SPEC suggests separate `nameRu` and `nameEn` fields
- Current implementation is simpler and functional

**Resolution:**
- Documented in AUDIT_SPEC.md
- Current implementation is acceptable for MVP
- Can be enhanced later if needed

**Files:**
- `prisma/schema.prisma` (ServiceCategory, ServiceType models)

---

#### 6. PlaceService Model Simplicity
**Date:** 2025-11-14  
**Section:** 7. КАБИНЕТ БИЗНЕСА

**Issue:** PlaceService model is simpler than SPEC

**Finding:**
- Uses single `price` instead of `priceFrom`/`priceTo`
- No `currency` field (assumes RUB)
- No `isSpecialOffer`, `specialLabel`, `notes` fields
- DELETE is hard delete, not soft delete

**Resolution:**
- Documented in AUDIT_SPEC.md
- Current implementation is functional for MVP
- Can be enhanced later

**Files:**
- `prisma/schema.prisma` (PlaceService model)
- `app/api/business/places/[placeId]/services/[serviceId]/route.ts` (DELETE endpoint)

---

#### 7. Redirect Paths
**Date:** 2025-11-14  
**Section:** 2, 3. АУТЕНТИФИКАЦИЯ

**Issue:** SPEC mentions `/dashboard` but project redirects to `/map` for CITIZEN

**Finding:**
- CITIZEN redirects to `/map` after login/registration
- `/dashboard` exists but is legacy/placeholder
- `/map` is more appropriate for the use case

**Resolution:**
- Documented in AUDIT_SPEC.md
- Current behavior is correct for this project

**Files:**
- `app/auth/login/page.tsx`
- `app/auth/register/page.tsx`

---

#### 8. Bug: Wrong Role Check in Dashboard
**Date:** 2025-11-14  
**Section:** 2. АУТЕНТИФИКАЦИЯ

**Issue:** `/dashboard` page checks for role `USER` instead of `CITIZEN`

**Finding:**
- `app/dashboard/page.tsx` line 11: `if (session.role !== 'USER')`
- Project uses `CITIZEN` role, not `USER`
- This would cause incorrect redirects

**Resolution:**
- Changed to `if (session.role !== 'CITIZEN')`
- Updated README.md to reflect correct role name

**Files:**
- `app/dashboard/page.tsx` (fixed)
- `README.md` (updated role documentation)

**Status:** ✅ FIXED

---

## Summary of Findings

### ✅ Working Correctly
1. Infrastructure setup
2. Authentication flow (custom implementation)
3. Registration (CITIZEN and BUSINESS_OWNER)
4. Business dashboard and services management
5. Admin panel (cities, franchises)
6. Service catalog API

### ⚠️ Acceptable Differences from SPEC
1. Custom auth instead of NextAuth.js (simpler, works)
2. CITIZEN role instead of USER (more descriptive)
3. Simpler service models (functional for MVP)
4. Redirect to `/map` instead of `/dashboard` (more appropriate)

### ❌ Missing Features (Known Gaps)
1. Profile editing functionality
2. Avatar upload and display
3. Photo gallery

### 🔧 Potential Improvements (Not Critical)
1. Add `priceFrom`/`priceTo` to PlaceService
2. Add `currency` field
3. Add special offers functionality
4. Soft delete for services
5. Separate `nameRu`/`nameEn` fields

---

## Recommendations

### High Priority (Future)
1. Implement profile editing page
2. Add avatar upload with Supabase Storage
3. Add photo gallery functionality

### Medium Priority (Enhancements)
1. Add price range (priceFrom/priceTo) to PlaceService
2. Add currency support
3. Add special offers functionality

### Low Priority (Nice to Have)
1. Separate nameRu/nameEn fields
2. Soft delete for services
3. More detailed service metadata

---

---

#### 9. Profile, Avatar, and Photo Gallery Implementation
**Date:** 2025-11-15  
**Section:** 4. ПРОФИЛЬ, АВАТАР, ГАЛЕРЕЯ

**Issue:** Profile editing, avatar upload, and photo gallery not implemented (High Priority from audit)

**Implementation:**
1. **Database Schema:**
   - Added `avatarUrl` field to `UserProfile` model
   - Created `UserPhoto` model for photo gallery
   - Migration: `20251114180000_add_profile_avatar_and_photos`

2. **Supabase Storage:**
   - Created `lib/supabase.ts` with admin client
   - Configured `USER_PHOTOS_BUCKET` (default: 'user-photos')
   - Server-side only (Service Role Key)

3. **API Endpoints:**
   - `GET /api/profile` - Get user profile
   - `PUT /api/profile` - Update user profile
   - `POST /api/profile/avatar` - Upload avatar
   - `GET /api/profile/photos` - Get user photos
   - `POST /api/profile/photos` - Upload photo
   - `PATCH /api/profile/photos/[photoId]` - Set photo as avatar
   - `DELETE /api/profile/photos/[photoId]` - Delete photo

4. **UI:**
   - Updated `/settings` page with full profile editing
   - Avatar upload with preview
   - Photo gallery with set-as-avatar and delete functionality
   - Integrated avatar display in Navbar

5. **Dependencies:**
   - Added `@supabase/supabase-js` package

**Files Created/Modified:**
- `prisma/schema.prisma` (added avatarUrl, UserPhoto model)
- `prisma/migrations/20251114180000_add_profile_avatar_and_photos/migration.sql`
- `lib/supabase.ts` (new)
- `app/api/profile/route.ts` (new)
- `app/api/profile/avatar/route.ts` (new)
- `app/api/profile/photos/route.ts` (new)
- `app/api/profile/photos/[photoId]/route.ts` (new)
- `app/settings/page.tsx` (complete rewrite)
- `components/Navbar.tsx` (added avatar display)
- `app/api/auth/me/route.ts` (added avatarUrl to response)
- `lib/auth-client.ts` (added avatarUrl to UserSession interface)

**Status:** ✅ IMPLEMENTED

**Note:** Requires Supabase Storage bucket `user-photos` to be created in Supabase Dashboard.

---

**Last Updated:** 2025-11-15

