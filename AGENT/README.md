# 🤖 AGENT Instructions

**⚠️ READ THIS FILE FIRST ON EVERY PROMPT**

---

## 📋 Before Starting ANY Task

1. **Read Context Files** (in this order):
   ```
   1. AGENT/PROJECT.md     → System overview, decisions, architecture
   2. AGENT/BACKEND.md     → Backend implementation details
   3. AGENT/API.md         → API endpoints (if API-related task)
   4. AGENT/FRONTEND-WEB.md → Frontend pages (if UI-related task)
   5. AGENT/TASKS.md       → Current priorities, known bugs
   6. AGENT/RULES.md       → Code standards, patterns to follow
   ```

2. **Check Current Sprint** in TASKS.md:
   - High Priority: My Students bugs, Products page, Settings page
   - Known Issues: Student detail 404, isActive status unclear

3. **Verify Critical Decisions**:
   - ✅ Soft delete (NEVER use .delete())
   - ✅ Multi-tenant (ALWAYS filter gymId)
   - ✅ Ön sipariş sistemi (NO payment gateway)
   - ✅ Trainer permissions (customPermissions JSONB - Phase 8)

---

## ✏️ After Completing ANY Task

**Update relevant MD files:**

- **Code changes** → Update BACKEND.md or FRONTEND-WEB.md
- **New feature** → Update PROJECT.md (Features section)
- **Bug fix** → Mark completed in TASKS.md
- **API change** → Update API.md
- **New decision** → Update PROJECT.md (Important Decisions)

**Always update TASKS.md:**
- Move completed task to ✅ Completed section
- Add new tasks if discovered
- Update progress metrics

---

## 🎯 Quick Reference

**User Intent Signals:**
- "bug", "hata", "404" → Check TASKS.md Known Issues
- "yeni sayfa", "page" → Read FRONTEND-WEB.md
- "api", "endpoint" → Read API.md + BACKEND.md
- "trainer", "owner", "yetki" → Check RULES.md Security + BACKEND.md RBAC
- "database", "tablo", "migration" → Check BACKEND.md + RULES.md Database

**Critical Patterns:**
```typescript
// Multi-tenant
where: { gymId: req.user.gymId, deleted_at: null }

// Soft delete
data: { deleted_at: new Date() }

// Auth
authenticate, requirePermission('resource.action')
```

---

## 🚨 Never Forget

1. **Gym isolation** in every query
2. **Soft delete** pattern
3. **Update TASKS.md** after work
4. **Follow RULES.md** patterns
5. **Check FRONTEND-WEB.md** before UI work

---

**Last Updated:** 12 Aralık 2025
