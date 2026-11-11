# C01 Low-Compute Edge Inference Benchmark Report

**Run ID:** `C01-MWCNHV3Y`  
**Execution Timestamp:** 2026-11-11T21:48:23.613Z  
**Overall Benchmark Status:** **PASS**  
**Cryptographic Attestation:** `ed25519:8e7986c5da5e72350ea45b20b482a05595f9c64b...` (Verified: true)

---

## 1. Mandatory Threshold Compliance

| Metric | Target Requirement | Measured Value | Compliance Status |
|---|---|---|---|
| **Batch Size** | 100 actual inference inputs | **100 inputs** | PASS ✅ |
| **Total Batch Latency** | < 200.00 ms | **5.497 ms** | PASS ✅ |
| **Peak Operational Memory** | < 256.00 MB | **60.41 MB** | PASS ✅ |
| **Final Result** | Latency & Memory both satisfied | **PASS** | PASS ✅ |

---

## 2. Detailed Performance Envelopes

- **Batch Size:** 100 deterministic synthetic feature vectors (four archetypes)
- **Input provenance:** Generated in-script from fixed archetype ranges, not sampled from open-data archives. The measurement covers 100 real inference executions of the quantized model; it does not validate predictive skill.
- **Total Batch Execution Time:** `5.497 ms`
- **Mean Latency per Inference:** `0.055 ms`
- **50th Percentile (p50):** `0.0123 ms`
- **95th Percentile (p95):** `0.1166 ms`
- **99th Percentile (p99):** `0.8946 ms`
- **Throughput:** `18191.1 inferences/second`
- **Peak RSS Memory:** `60.41 MB`

---

## 3. Host Device Hardware Profile

- **CPU Model:** Intel(R) Core(TM) i7-8650U CPU @ 1.90GHz
- **Architecture:** x64 (win32)
- **Physical/Logical Cores:** 8 cores @ 2112 MHz
- **Total Physical RAM:** 15.84 GB (Free: 3.32 GB)
- **OS Kernel:** 10.0.22621

---

## 4. Execution Runtime & Environment

- **Runtime Engine:** Node.js (v26.13.0)
- **V8 Engine Version:** 14.6.202.34-node.40
- **Process ID (PID):** 17556
- **Process Uptime:** 0.1s

---

## 5. Model Architecture & Storage Footprint

- **Model Identifier:** `ClimateGuard-Edge-INT8-QuantNet`
- **Architecture:** `Dense-32-ReLU -> Dense-16-ReLU -> Softmax-3`
- **Total Learnable Parameters:** 867
- **Quantization:** INT8 Uniform Fixed-Point
- **Raw Weights Binary Size:** 867 bytes (`0.847 KB`)
- **External Dependencies:** Zero external native runtimes (Native JavaScript / WebAssembly portable)

---

## 6. Cryptographic Hardware Attestation

- **Signature Algorithm:** `Ed25519 (RFC 8032)`
- **Public Key:** `302a300506032b657003210046027982e30df6b0266f06252771c081c54074b7a13c1c0b8e42b862f31d038b`
- **Digital Signature:**
```
ed25519:8e7986c5da5e72350ea45b20b482a05595f9c64b9b360b97cc1545ef0e935c6582c272c8de2055f4dafbf9b937d6eefd59b5d211bbb8cc28904059e66b94bd01
```
- **Signature Cryptographic Verification:** `VERIFIED (TRUE)`

---

## 7. Sample Predictions (First 5 of 100 Batch Inputs)

| Sample # | Flood Risk Prob | Heatwave Risk Prob | Drought Risk Prob |
|---|---|---|---|
| #1 | 100.0% | 0.0% | 0.0% |
| #2 | 0.0% | 0.0% | 100.0% |
| #3 | 0.0% | 0.0% | 100.0% |
| #4 | 99.5% | 0.5% | 0.0% |
| #5 | 100.0% | 0.0% | 0.0% |

*Report generated automatically by ClimateGuard AI C01 Edge Benchmark Suite.*
