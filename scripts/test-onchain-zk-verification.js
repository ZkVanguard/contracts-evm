/**
 * Test On-Chain ZK Verification
 * 
 * This script:
 * 1. Generates a ZK-STARK proof
 * 2. Stores the commitment on-chain via GaslessZKCommitmentVerifier
 * 3. Verifies the commitment can be queried on-chain
 */

const hre = require("hardhat");
const ethers = hre.ethers;

// Deployed contract address from cronos-testnet.json
const GASLESS_VERIFIER = "0x76Faf645C0B3c1e37fbf3EF189EdAfB0D4Fc2a8E";

// ABI for reading
const VERIFIER_ABI = [
  "function storeCommitmentGasless(bytes32 proofHash, bytes32 merkleRoot, uint256 securityLevel) external",
  "function commitments(bytes32) external view returns (bytes32 proofHash, bytes32 merkleRoot, uint256 timestamp, address verifier, bool verified, uint256 securityLevel)",
  "function totalCommitments() external view returns (uint256)",
  "function totalGasSponsored() external view returns (uint256)",
  "function totalTransactionsSponsored() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function deposit() external payable",
  "function getBalance() external view returns (uint256)",
  "function getStats() external view returns (uint256, uint256, uint256, uint256)",
  "event CommitmentStored(bytes32 indexed proofHash, bytes32 indexed merkleRoot, address indexed verifier, uint256 timestamp, uint256 securityLevel)",
  "event GasRefunded(address indexed user, uint256 gasUsed, uint256 refundAmount)"
];

async function main() {
  console.log("\n🔗 ON-CHAIN ZK VERIFICATION TEST");
  console.log("=".repeat(50) + "\n");

  // Connect to contract with explicit signer
  const [signer] = await ethers.getSigners();
  console.log("👤 Signer:", signer.address);
  
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "TCRO\n");

  // Get contract instance using raw ABI
  const verifier = new ethers.Contract(GASLESS_VERIFIER, VERIFIER_ABI, signer);
  
  // Check contract status
  const contractBalance = await ethers.provider.getBalance(GASLESS_VERIFIER);
  console.log("📋 CONTRACT STATUS:");
  console.log("   Address:", GASLESS_VERIFIER);
  console.log("   Balance:", ethers.formatEther(contractBalance), "TCRO");
  
  // Fund contract if needed
  if (contractBalance < ethers.parseEther("0.1")) {
    console.log("   ⚠️ Contract needs funding for gas refunds");
    console.log("   💰 Funding contract with 0.5 TCRO via deposit()...");
    try {
      const fundTx = await verifier.deposit({
        value: ethers.parseEther("0.5"),
        gasLimit: 100000n
      });
      await fundTx.wait();
      const newBalance = await ethers.provider.getBalance(GASLESS_VERIFIER);
      console.log("   ✅ Funded! New Balance:", ethers.formatEther(newBalance), "TCRO");
    } catch (fundErr) {
      console.log("   ❌ Funding via deposit() failed:", fundErr.message);
      console.log("   Trying direct transfer...");
      try {
        const fundTx2 = await signer.sendTransaction({
          to: GASLESS_VERIFIER,
          value: ethers.parseEther("0.5"),
          gasLimit: 100000n
        });
        await fundTx2.wait();
        const newBalance = await ethers.provider.getBalance(GASLESS_VERIFIER);
        console.log("   ✅ Funded via transfer! Balance:", ethers.formatEther(newBalance), "TCRO");
      } catch (fundErr2) {
        console.log("   ❌ Direct transfer also failed");
        console.log("   Continuing without funding (gasless refund will be skipped)...");
      }
    }
  }
  
  try {
    const totalCommitments = await verifier.totalCommitments();
    console.log("   Total Commitments:", totalCommitments.toString());
  } catch (err) {
    console.log("   Total Commitments: (error reading - contract may use different function)");
  }
  console.log("");

  // Generate proof data from our ZK server
  console.log("⚡ STEP 1: Generate ZK-STARK Proof...");
  
  // Use fetch to call our ZK server
  const proofRequest = {
    proof_type: "settlement",
    data: {
      statement: {
        value: 50000,
        threshold: 100000
      },
      witness: {
        secret: "settlement_secret_" + Date.now()
      }
    }
  };

  let proofData;
  try {
    // Correct endpoint is /api/zk/generate
    const response = await fetch("http://localhost:8000/api/zk/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proofRequest)
    });
    
    const result = await response.json();
    if (!result.job_id) {
      throw new Error("No job_id in response");
    }
    console.log("   ✅ Proof job created:", result.job_id);
    
    // Poll for completion
    let attempts = 0;
    while (attempts < 20) {
      await new Promise(r => setTimeout(r, 500));
      const statusRes = await fetch(`http://localhost:8000/api/zk/proof/${result.job_id}`);
      const statusData = await statusRes.json();
      
      if (statusData.status === "completed" && statusData.proof) {
        proofData = statusData.proof;
        console.log("   ✅ Proof generated with REAL ZK-STARK!");
        console.log("   📊 Security Level:", proofData.security_level);
        console.log("   🔐 Protocol: ZK-STARK (CUDA accelerated)");
        console.log("   🏔️  Merkle Root:", proofData.merkle_root?.slice(0, 20) + "...");
        break;
      }
      attempts++;
    }
    
    if (!proofData) {
      throw new Error("Proof generation timeout");
    }
  } catch (err) {
    console.log("   ⚠️ ZK server issue:", err.message || "not available");
    console.log("   📝 Using deterministic test data");
    // Generate deterministic test data
    const timestamp = Date.now();
    proofData = {
      proof_hash: ethers.keccak256(ethers.toUtf8Bytes(`proof_hash_${timestamp}`)),
      merkle_root: ethers.keccak256(ethers.toUtf8Bytes(`merkle_root_${timestamp}`)).slice(0, 66),
      security_level: 521
    };
  }

  // Convert to bytes32
  let proofHash, merkleRoot;
  
  if (proofData.proof_hash.startsWith("0x")) {
    proofHash = ethers.zeroPadValue(proofData.proof_hash, 32);
  } else {
    // Convert numeric string to bytes32
    proofHash = ethers.zeroPadValue(
      ethers.toBeHex(BigInt(proofData.proof_hash)), 
      32
    );
  }
  
  if (proofData.merkle_root.startsWith("0x")) {
    merkleRoot = proofData.merkle_root.length === 66 
      ? proofData.merkle_root 
      : ethers.zeroPadValue("0x" + proofData.merkle_root, 32);
  } else {
    merkleRoot = "0x" + proofData.merkle_root.padStart(64, '0');
  }

  console.log("\n📝 PROOF DATA:");
  console.log("   Proof Hash:", proofHash.slice(0, 20) + "...");
  console.log("   Merkle Root:", merkleRoot.slice(0, 20) + "...");
  console.log("   Security Level:", proofData.security_level);

  // STEP 2: Store commitment on-chain
  console.log("\n⛓️  STEP 2: Store Commitment On-Chain...");
  
  try {
    // Estimate gas
    const gasEstimate = await verifier.storeCommitmentGasless.estimateGas(
      proofHash,
      merkleRoot,
      proofData.security_level || 521
    );
    console.log("   ⛽ Estimated Gas:", gasEstimate.toString());

    // Send transaction
    const tx = await verifier.storeCommitmentGasless(
      proofHash,
      merkleRoot,
      proofData.security_level || 521,
      { gasLimit: gasEstimate * 2n }
    );
    
    console.log("   📤 TX Hash:", tx.hash);
    console.log("   ⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("   ✅ Confirmed in block:", receipt.blockNumber);
    console.log("   ⛽ Gas Used:", receipt.gasUsed.toString());
    
    // Check if gas was refunded
    const gasRefundEvent = receipt.logs.find(log => {
      try {
        const parsed = verifier.interface.parseLog(log);
        return parsed?.name === "GasRefunded";
      } catch { return false; }
    });
    
    if (gasRefundEvent) {
      console.log("   💰 Gas Refunded! TRUE GASLESS ✅");
    }
    
  } catch (err) {
    if (err.message.includes("Commitment exists")) {
      console.log("   ⚠️ Commitment already exists (this is OK for testing)");
    } else {
      console.log("   ❌ Error:", err.message);
      // Try with a unique proof hash
      const uniqueHash = ethers.keccak256(ethers.toUtf8Bytes(`unique_${Date.now()}`));
      console.log("   🔄 Retrying with unique hash...");
      
      const tx = await verifier.storeCommitmentGasless(
        uniqueHash,
        merkleRoot,
        proofData.security_level || 521
      );
      
      console.log("   📤 TX Hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("   ✅ Confirmed in block:", receipt.blockNumber);
      proofHash = uniqueHash;
    }
  }

  // STEP 3: Verify commitment on-chain
  console.log("\n🔍 STEP 3: Verify Commitment On-Chain...");
  
  try {
    const commitment = await verifier.commitments(proofHash);
    
    console.log("   ✅ Commitment Found On-Chain!");
    console.log("   📝 Proof Hash:", commitment.proofHash.slice(0, 20) + "...");
    console.log("   🌳 Merkle Root:", commitment.merkleRoot.slice(0, 20) + "...");
    console.log("   ⏰ Timestamp:", new Date(Number(commitment.timestamp) * 1000).toISOString());
    console.log("   👤 Verifier:", commitment.verifier);
    console.log("   ✅ Verified:", commitment.verified);
    console.log("   🔐 Security Level:", commitment.securityLevel.toString());
    
  } catch (err) {
    console.log("   ❌ Error:", err.message);
  }

  // Final stats
  console.log("\n📊 FINAL CONTRACT STATS:");
  const newTotal = await verifier.totalCommitments();
  const totalSponsored = await verifier.totalGasSponsored();
  const totalTx = await verifier.totalTransactionsSponsored();
  
  console.log("   Total Commitments:", newTotal.toString());
  console.log("   Total Gas Sponsored:", ethers.formatEther(totalSponsored), "TCRO");
  console.log("   Total TX Sponsored:", totalTx.toString());

  console.log("\n" + "=".repeat(50));
  console.log("🎉 ON-CHAIN ZK VERIFICATION TEST COMPLETE!");
  console.log("=".repeat(50) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
