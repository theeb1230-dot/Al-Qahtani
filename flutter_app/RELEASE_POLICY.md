# Al-Qahtani four-surface release policy

Al-Qahtani is one product delivered across four synchronized surfaces:

1. Web/PWA stays on the existing GitHub Pages deployment.
2. Android Mobile is delivered as an APK.
3. Android TV is delivered as a separate APK with LEANBACK, D-Pad/focus and TV-specific UX.
4. iOS is delivered as an explicitly UNSIGNED/no-codesign IPA that requires external signing/provisioning before installation.

For every product-impacting merge, version/build must advance. Mobile APK, TV APK and IPA UNSIGNED must come from the same commit/version and pass fail-closed verification before a GitHub Release is published. The Web/PWA is verified on the same merge commit but remains on GitHub Pages rather than being substituted by a Release asset or Flutter Web.

Feature parity is the default across all four surfaces. Platform-specific differences are allowed only when required by platform APIs and must be explicit. Flutter consumes only Al-Qahtani runtime/API contracts and must not expose upstream source URLs, worker/session material or source-side secrets.
