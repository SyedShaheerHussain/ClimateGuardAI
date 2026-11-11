# Architecture

The current architecture document lives at **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**.

It describes the Next.js route-handler layout, the single city/risk/finance source of truth, the
security guards, and the explicit non-goals (no ML model in the live path, no official alert feed,
no oracle quorum, no payouts).

The original Stitch design blueprint that preceded this file has been removed because it described
components (Sepolia notarization, Merkle proofs, global basins, USD payouts) that this build does
not implement.
