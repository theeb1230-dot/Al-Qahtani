# Al-Qahtani Autonomous Development Agent Architecture

## الهدف
بناء حلقة تطوير ذاتي آمنة وشفافة تفحص حالة مشروع القحطاني، تجمع الأدلة، تصنف الأعطال، تقترح خطة إصلاح، تنفذ التعديلات على فرع واحد فقط، وتشغل بوابات التحقق قبل أي دمج.

## مبادئ ثابتة
1. GitHub هو مصدر الحقيقة النهائي للكود وحالة CI والإصدارات.
2. لا تعديل مباشر على `main` من الوكيل.
3. PR واحد مفتوح فقط للتطوير الذاتي. إذا وجد PR مفتوح، يعمل الوكيل عليه بدل إنشاء PR جديد.
4. لا يعتبر HTTP 200 أو نجاح build دليلاً على نجاح سلوك يحتاج جهازًا حقيقيًا.
5. أي حالة PHYSICAL-DEVICE VERIFIED تبقى بشرية/جهازية ولا يرفعها CI وحده.
6. لا يدمج الوكيل أي PR إلا إذا كانت بوابات exact-head المطلوبة كلها خضراء.
7. الأعطال الخارجية المتقطعة تعاد مرة على نفس SHA قبل اعتبارها عيب كود.
8. أسرار المزودين وروابط upstream لا تظهر في تقارير عامة أو تطبيق العميل.

## طبقات الوكيل

### 1. Observer
يجمع في كل تشغيل:
- SHA الحالي لـ `main`.
- PR المفتوح وحالته وhead SHA.
- نتائج GitHub Actions المرتبطة بالـ SHA الحالي.
- آخر Release وملفاته.
- فشل Pages/Flutter/runtime/live-provider tests.
- محتوى `docs/AUTONOMOUS_DEVELOPMENT_STATE.md`.
- Issues الموسومة `agent:*` و`bug` و`p0` و`p1`.

المخرج: `agent/state-snapshot.json` أو تعليق منظم على Issue مركزي.

### 2. Triage
يصنف كل مشكلة إلى:
- `CODE_DEFECT`: فشل reproducible سببه الكود.
- `TEST_DEFECT`: الاختبار نفسه خاطئ أو هش.
- `UPSTREAM_TRANSIENT`: مزود خارجي أو شبكة مؤقتة.
- `INFRA_FAILURE`: GitHub runner/Actions/tooling.
- `DEVICE_REQUIRED`: يحتاج iPhone/Android/TV حقيقي.
- `SECURITY_BOUNDARY`: يحتاج موافقة بشرية قبل التنفيذ.

الأولوية:
P0 تشغيل/تحميل/فقدان بيانات/أمان
P1 playback/fallback/download reliability
P2 UX/accessibility/performance
P3 تجميلي/تنظيف

### 3. Planner
ينشئ خطة صغيرة قابلة للقياس، بحد أقصى تغير منطقي واحد في الدفعة.
كل خطة يجب أن تحتوي:
- المشكلة والدليل.
- الملفات المحتمل تغييرها.
- الاختبارات المتوقع أن تثبت الإصلاح.
- مخاطر regression.
- rollback condition.

### 4. Executor
- إذا يوجد PR مفتوح: يستخدم فرعه الحالي.
- إذا لا يوجد: ينشئ فرع `agent/fix-<short-id>` وPR draft.
- يطبق أقل تعديل يزيل السبب الجذري.
- لا يجمع refactor كبير مع bugfix.
- يحدث `docs/AUTONOMOUS_DEVELOPMENT_STATE.md` فقط بعد وجود دليل فعلي.

### 5. Verifier
يتحقق من exact head SHA بعد التعديل:
- Node syntax/runtime tests.
- Content/runtime contracts.
- Fallback/HLS/CORS/download tests.
- Web smoke وMobile WebKit عند تأثر الويب.
- `flutter analyze` و`flutter test`.
- Android Mobile APK build/identity/signature.
- Android TV build/LEANBACK/focus prerequisites.
- iOS unsigned IPA build/bundle identity/no-codesign.
- release provenance/checksums عندما تكون الدفعة release candidate.

إذا فشل تحقق واحد:
- يجلب log الفعلي.
- يعيد التصنيف.
- يصلح على نفس الفرع.
- لا يفتح PR ثانياً.

## بروتوكول الدمج
الدمج مسموح فقط عندما:
1. head SHA لم يتغير منذ آخر مجموعة اختبارات.
2. كل workflow مطلوب للملفات المتأثرة SUCCESS.
3. لا توجد review threads غير محلولة.
4. لا توجد P0 جديدة أحدث من الخطة.
5. أي بند DEVICE_REQUIRED موثق بوضوح على أنه Pending وليس Passed.

يفضل squash merge مع expected-head protection.

## Issue مركزي للوكيل
ينصح بإنشاء Issue ثابت بعنوان:
`Autonomous Agent Control Plane`

يستخدم كسجل حي يتضمن في كل تشغيل:
- timestamp UTC.
- main SHA / PR / head SHA.
- health summary.
- failures الجديدة.
- classification.
- الإجراء المتخذ.
- workflows المعاد تشغيلها.
- النتيجة النهائية.
- next action.

## تشغيل مجدول
GitHub Actions workflow باسم `autonomous-agent-observer.yml` يعمل:
- كل ساعة.
- عند `workflow_dispatch`.
- بعد اكتمال workflows الحرجة عند الحاجة.

مرحلة Observer يجب أن تكون read-only قدر الإمكان.
مرحلة الإصلاح لا تبدأ إلا عند وجود failure مصنف `CODE_DEFECT` مع أدلة كافية.

## حدود الأمان
يمنع التنفيذ التلقائي الكامل في الحالات التالية:
- تغيير secrets أو credentials.
- توسيع allowlists أو CORS بشكل واسع.
- تغيير auth/permissions/signing.
- حذف بيانات أو migrations غير قابلة للعكس.
- تعطيل اختبارات حتى تصبح CI خضراء.
- تحويل DEVICE_REQUIRED إلى VERIFIED بدون دليل جهاز.
- إدخال provider URLs/secrets إلى Flutter أو الواجهة العامة.

## نموذج الحلقة
```text
GitHub / Runtime / CI / Releases
            ↓
         Observer
            ↓
          Triage
            ↓
          Planner
            ↓
          Executor
            ↓
          Verifier
        ↙         ↘
     FAIL         PASS
      ↓             ↓
 نفس الفرع      Review/Merge Gate
      └──────→ Observer
```

## المرحلة الأولى المقترحة للقحطاني
1. إضافة Observer workflow فقط بدون صلاحية تعديل الكود.
2. إنشاء Control Plane Issue.
3. إخراج تقرير JSON/Markdown موحد لكل تشغيل.
4. ربط workflow run failures بالـ exact SHA.
5. دعم إعادة تشغيل transient failed jobs مرة واحدة.
6. بعد ثبات الرصد، إضافة Executor محدود فقط لإصلاحات واضحة ومغلقة النطاق.
7. إبقاء merge خطوة محكومة ببوابات exact-head حتى لو أصبح إنشاء التعديل آلياً.

## معيار النجاح
النظام يعتبر ناجحاً عندما يستطيع اكتشاف failure حقيقي، ربطه بالـ SHA الصحيح، تصنيفه، إنشاء أو تحديث PR واحد، تشغيل الاختبارات الصحيحة، وإنتاج تقرير صادق يفرق بين CI VERIFIED وPHYSICAL-DEVICE VERIFIED دون تدخل يدوي في جمع الأدلة.
