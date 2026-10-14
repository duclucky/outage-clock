# Integrating an OutageClock lease

Use SDK1.1.8's `studionet` preset and verify chain61999. All amounts shown here
are GEN. Connect an authorized signer at createClient; no per-call raw account
override. Scripts load ignored project.env then authorized parent.env.

1. Issuer calls create_lease(id,buyer,scope,incidentIdsJSON,referenceStart,
   referenceEnd,acceptDeadline,baseDeadline,extensionCap). Unix seconds are UTC.
   Scope must define the exact service/mode and what impairment counts. Selected
   official resolved incident IDs and reference window are explicit terms; this
   is not an unbounded future-outage feed or a measured-customer-uptime promise.
2. Buyer reads get_lease and accepts the exact digest with1GEN. Origin, value,
   version, parties, source, incident list, deadlines and cap are contract-bound.
3. Either named party calls review_clock before hard cutoff. Track FINALIZED
   plus successful execution. Reload get_lease/get_clock; use dynamic last_attempt
   for get_attempt. READY means a verified complete clock; RETRYABLE keeps escrow
   locked. No SDK-supplied verdict, amount or deadline is accepted as canonical.
4. Buyer may exercise once strictly before effective deadline. A real gateway
   must independently enforce that finalized exercise before its own side effect.
   This repository claims internal exercise only, not external gateway execution.
5. Either party can recover at/after verified effective deadline if unused; for
   unresolved/sourcefailure/attemptcap leases, recover at/after base+cap. Buyer
   need not wait for issuer. An unpaid offer cancels at/after accept deadline.
6. get_credit returns the exact current fixed credit owner. Only that wallet
   can withdraw its1GEN. Check child finality and exact native/recipient deltas,
   not only parent success. Due credit never expires.
7. Either party zero-closes only when terminal and all credit withdrawn. Final
   get_accounting and actual native balance must both show0GEN liability.

LangGraph retry broker: get_clock plus buyer exercise. A2A prepaid entitlement
gateway: finalized get_lease/exercised identity. DAOhaus timed-mandate adapter:
effective expiry, recover and own credit. These are proposed consumers; no
third-party adopter or production gateway is claimed.

Local boundaries prove overlap union, clipping, cap, source/auth/JSON/semantic
failures and no double action. The real lifecycle evidence identifies exactly
which cases ran; local evidence never substitutes for network receipts.
