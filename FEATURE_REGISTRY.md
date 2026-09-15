# Al-Qahtani TV — Feature Registry

> هذا الملف هو الذاكرة الدائمة لمنع تكرار الميزات. لا يُستخدم كقائمة عمل مؤقتة، ولا تُحذف منه الميزات التاريخية عند انتهاء دورة التطوير.

## قواعد السجل
- لكل ميزة `FEATURE_ID` ثابت وفريد.
- لا تُعتبر الميزة مطبقة لمجرد كتابة الكود. تنتقل إلى `APPROVED` فقط بعد اعتماد المراقب على exact SHA.
- الحالات المسموحة: `PROPOSED`, `IN_PROGRESS`, `IMPLEMENTED_PENDING_REVIEW`, `APPROVED`, `REGRESSED`, `REJECTED`, `SUPERSEDED`.
- قبل اقتراح أي ميزة جديدة، يجب البحث في هذا الملف وفي الكود وPROJECT_STATE.md لمنع التكرار الدلالي، حتى لو اختلف الاسم.
- الميزات `APPROVED` تبقى محفوظة دائمًا كذاكرة تاريخية ولا تعاد إضافتها كميزة جديدة.
- إذا تعطلت ميزة سبق اعتمادها، تتحول إلى `REGRESSED` بنفس FEATURE_ID ولا تنشأ نسخة مكررة منها.
- لا يُسمح بحذف سجل ميزة مطبقة. التصحيح يكون بتحديث الحالة وإضافة Evidence جديد.

## Feature history
| FEATURE_ID | Feature | Area | Status | Introduced SHA | Approved SHA | Verification | Notes |
|---|---|---|---|---|---|---|---|
| LEGACY-001 | Existing product/release history | Existing application | APPROVED | historical | historical | See docs/AUTONOMOUS_DEVELOPMENT_STATE.md | السجل التفصيلي السابق يبقى في وثيقة الحالة ويجب ترحيل الميزات المعروفة تدريجيًا إلى هذا السجل دون اختراع أدلة. |

## Regression memory
| FEATURE_ID | Regression | Detected SHA | Feedback reference | Current state |
|---|---|---|---|---|

## Cycle archive
<!-- بعد اعتماد كل دورة، أضف ملخصًا: Cycle ID، الميزات العشرون، عدد APPROVED/REGRESSED/REJECTED، release/version، exact SHA. لا تحذف الدورات السابقة. -->
