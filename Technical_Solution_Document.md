# Technical Solution Document

## 5.2 Duplicate Question Detection with 3-Zone Intercept (Critical — P0)

**Why it's the best:** Every undetected duplicate is a failure of the Zero Wait Time system — the answer already exists, the student just wasn't shown it. The 3-zone cosine similarity model (hard block ≥0.90, soft modal 0.75–0.89, gentle suggest 0.60–0.74) is the most sophisticated treatment of this problem across all documents.

**What makes it better than what the team proposed:** D4 mentions "duplicate question detection logic" as a backend bullet point with no design. D6 introduces "confidence-based routing" which is adjacent but addresses AI confidence, not question similarity. The architecture document combines both ideas into a single triage pipeline.

**Critical missing piece across all documents:** No team document specifies the `duplicateOf` field on the `Question` schema, the escape hatch UX ("This didn't solve my issue — post anyway"), or what happens to a hard-blocked duplicate in the database. These are all resolved in this Technical Solution Document.
