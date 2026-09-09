# Provider inventory

This document tracks external dependencies inherited from the original site.

| Area | Endpoint / host | Current role | Migration direction |
|---|---|---|---|
| Matches | `https://api.albasritv1.workers.dev/` | Match schedule, session and server discovery | Wrap behind provider interface, add health/fallback |
| News | `https://news.albesriali03.workers.dev/` | News API | Wrap behind provider interface, add fallback |
| Cinema | `https://albas.albesriali03.workers.dev/` | Movies/series API + session | Wrap behind provider interface, remove origin lock |
| Cinema catalogue source | `https://akwam.ss/` | Category/search source passed to cinema Worker | Keep behind backend/provider layer |
| Legacy Android player | `com.bsr.player.pro` | Intent target | Remove from public runtime after web-native player parity |
| Legacy store redirect | Google Play URL for `com.bsr.player.pro` | Fallback for missing app | Remove with legacy player bridge |

## Rules

1. UI code must not acquire new provider URLs directly.
2. Existing URLs are documented first, then moved behind a provider/repository layer.
3. Provider failure must not crash navigation; expose typed unavailable/degraded states.
4. Health checks must distinguish transport failure, HTTP failure, invalid payload, and playable-source failure.
5. Do not delete legacy logic until equivalent behavior is verified in the new web/Flutter path.
