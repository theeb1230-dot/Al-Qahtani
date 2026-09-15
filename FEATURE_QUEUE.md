# Al-Qahtani TV — Active Feature Queue

STATUS: NEEDS_PLANNING
CYCLE_ID: UNASSIGNED
BASE_SHA: UNASSIGNED
TARGET_COUNT: 20

> هذا الملف قائمة العمل المتغيرة للدورة الحالية فقط. FEATURE_REGISTRY.md هو الذاكرة الدائمة.

## قواعد الدورة
1. لا تُنشأ دورة ميزات جديدة إلا بعد اجتياز بوابة FEEDBACK واعتماد المراقب للحالة السابقة.
2. يجب أن تحتوي الدورة على 20 ميزة ذات قيمة حقيقية وغير مكررة دلاليًا مع FEATURE_REGISTRY.md أو التطبيق الحالي.
3. إذا أعاد المراقب ميزات من الدورة السابقة كـREGRESSED/CHANGES_REQUIRED، تدخل أولًا في الدورة التالية بنفس FEATURE_ID، ثم يُملأ العدد إلى 20 بميزات جديدة فقط. مثال: 5 إصلاحات راجعة + 15 ميزة جديدة = 20 عنصرًا.
4. لا تمسح عناصر الدورة قبل أرشفة نتيجتها في FEATURE_REGISTRY.md وربطها بالـexact SHA والأدلة.
5. الحالات: PLANNED, IN_PROGRESS, IMPLEMENTED_PENDING_REVIEW, APPROVED, FAILED, BLOCKED.
6. اكتمال كتابة الكود لا يساوي APPROVED. المراقب وحده يعتمد النتيجة.
7. بعد انتهاء واعتماد الدورة، تُفرغ هذه القائمة ويُرفع CYCLE_ID، ثم تُولد 20 ميزة للدورة التالية وفق القواعد نفسها.

## Current 20-feature cycle
| # | FEATURE_ID | Feature | Area | User value | Acceptance criteria | Status | Implementation SHA | Review result |
|---:|---|---|---|---|---|---|---|---|

## Cycle release gate
- [ ] Web/PWA verified on target deployment
- [ ] Android Mobile APK built and verified
- [ ] Android TV APK built and verified (LEANBACK + D-Pad/focus)
- [ ] iOS IPA UNSIGNED built and verified structurally
- [ ] Same product commit/version verified
- [ ] SHA-256 / provenance recorded
- [ ] Monitoring review completed
