import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure that election creation works correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      // Test successful election creation by owner
      Tx.contractCall('stellar-vote', 'create-election', [
        types.ascii("Test Election"),
        types.ascii("A test election"),
        types.uint(100)
      ], deployer.address),
      
      // Test failed election creation by non-owner
      Tx.contractCall('stellar-vote', 'create-election', [
        types.ascii("Test Election 2"),
        types.ascii("Another test election"),
        types.uint(100)
      ], wallet1.address)
    ]);
    
    block.receipts[0].result.expectOk().expectUint(0);
    block.receipts[1].result.expectErr().expectUint(100); // err-unauthorized
  }
});

Clarinet.test({
  name: "Test complete voting flow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const voter1 = accounts.get('wallet_1')!;
    
    // Create election
    let block1 = chain.mineBlock([
      Tx.contractCall('stellar-vote', 'create-election', [
        types.ascii("Test Election"),
        types.ascii("A test election"),
        types.uint(100)
      ], deployer.address)
    ]);
    
    // Add candidate
    let block2 = chain.mineBlock([
      Tx.contractCall('stellar-vote', 'add-candidate', [
        types.uint(0),
        types.uint(1),
        types.ascii("Candidate 1")
      ], deployer.address)
    ]);
    
    // Register voter
    let block3 = chain.mineBlock([
      Tx.contractCall('stellar-vote', 'register-voter', [
        types.uint(0),
        types.principal(voter1.address)
      ], deployer.address)
    ]);
    
    // Cast vote
    let block4 = chain.mineBlock([
      Tx.contractCall('stellar-vote', 'cast-vote', [
        types.uint(0),
        types.uint(1)
      ], voter1.address)
    ]);
    
    // Verify results
    let block5 = chain.mineBlock([
      Tx.contractCall('stellar-vote', 'get-candidate-info', [
        types.uint(0),
        types.uint(1)
      ], deployer.address)
    ]);
    
    block1.receipts[0].result.expectOk();
    block2.receipts[0].result.expectOk();
    block3.receipts[0].result.expectOk();
    block4.receipts[0].result.expectOk();
    
    const candidateInfo = block5.receipts[0].result.expectSome().expectTuple();
    assertEquals(candidateInfo['vote-count'], types.uint(1));
  }
});

Clarinet.test({
  name: "Test election ending functionality",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const voter1 = accounts.get('wallet_1')!;
    
    // Create and end election
    let block1 = chain.mineBlock([
      Tx.contractCall('stellar-vote', 'create-election', [
        types.ascii("Test Election"),
        types.ascii("A test election"),
        types.uint(100)
      ], deployer.address),
      Tx.contractCall('stellar-vote', 'end-election', [
        types.uint(0)
      ], deployer.address)
    ]);
    
    // Try to vote in ended election
    let block2 = chain.mineBlock([
      Tx.contractCall('stellar-vote', 'cast-vote', [
        types.uint(0),
        types.uint(1)
      ], voter1.address)
    ]);
    
    block1.receipts[0].result.expectOk();
    block1.receipts[1].result.expectOk();
    block2.receipts[0].result.expectErr().expectUint(102); // err-election-ended
  }
});

Clarinet.test({
  name: "Ensure voters cannot vote twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const voter1 = accounts.get('wallet_1')!;
    
    // Setup election and vote first time
    let setup = chain.mineBlock([
      Tx.contractCall('stellar-vote', 'create-election', [
        types.ascii("Test Election"),
        types.ascii("A test election"),
        types.uint(100)
      ], deployer.address),
      Tx.contractCall('stellar-vote', 'add-candidate', [
        types.uint(0),
        types.uint(1),
        types.ascii("Candidate 1")
      ], deployer.address),
      Tx.contractCall('stellar-vote', 'register-voter', [
        types.uint(0),
        types.principal(voter1.address)
      ], deployer.address),
      Tx.contractCall('stellar-vote', 'cast-vote', [
        types.uint(0),
        types.uint(1)
      ], voter1.address)
    ]);
    
    // Try to vote again
    let block = chain.mineBlock([
      Tx.contractCall('stellar-vote', 'cast-vote', [
        types.uint(0),
        types.uint(1)
      ], voter1.address)
    ]);
    
    block.receipts[0].result.expectErr().expectUint(101); // err-already-voted
  }
});
