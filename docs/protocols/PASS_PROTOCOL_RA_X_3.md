# RA-X-3 — Eighth L1 Route-Input Type + Its Verifier

**Pass ID:** RA-X-3  
**Seat:** Implementer (Grok), `F:\Caleb AI`.  
**Authorized by:** Pat (T4).  
**Reviewer/planner:** Claude Fable 5.

## Objective

Return `lineage_resolved_decision_facing_record` to the L1 allowlist (7 → 8)
**with** its five-check verifier in the same pass. Atomic type+verifier. Nothing
consumes the record yet (classifier is RA-X-4).

## Five checks

1. Lineage completeness  
2. Decision-field well-formedness  
3. No trust-tier assertion  
4. No route pre-commitment  
5. Satisfiability against single-source role-capability set  

## Single-source capability data

`src/roles/roleCapabilitySet.ts` — derived only from `listRoleContracts()`.
