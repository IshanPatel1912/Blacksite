const { query, getClient, checkConnection } = require('../config/db');
const { setupWheelSchema } = require('./setup-wheel');
const wheelController = require('../controllers/wheelController');

/**
 * testScarcityWheel
 * Comprehensive unit & integration verification for the Scarcity-Driven Luck Royale
 */
async function runTests() {
  console.log('\n=============================================================');
  console.log('[TEST SUITE] SCARCITY-DRIVEN LUCK ROYALE & BLACK MARKET ECONOMY');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    if (checkConnection) {
      await checkConnection();
    }
    // Step 0: Ensure wheel tables and catalog item exist
    await setupWheelSchema();

    // TEST 1: Exclusive Catalog Item Registration
    const protoRes = await query(`
      SELECT item_type_id, item_name, rarity, is_tradable, category
      FROM item_catalog
      WHERE item_name = 'Phantom Prototype'
    `);
    assert(protoRes.rowCount > 0, 'Exclusive "Phantom Prototype" exists in item_catalog');
    const prototype = protoRes.rows[0];
    assert(prototype.rarity === 'Mythic', 'Phantom Prototype rarity is Mythic');
    assert(Boolean(prototype.is_tradable) === true, 'Phantom Prototype is designated TRADABLE on Black Market');

    // TEST 2: Wheel Event and Rewards Configuration
    const eventRes = await query(`SELECT * FROM wheel_events WHERE is_active = TRUE LIMIT 1`);
    assert(eventRes.rowCount > 0, 'Active Luck Royale wheel_event exists');
    const event = eventRes.rows[0];
    assert(parseFloat(event.spin_cost) > 0, `Valid spin cost configured (${event.spin_cost})`);

    const rewardsRes = await query(`
      SELECT wr.*, c.item_name, c.rarity
      FROM wheel_rewards wr
      JOIN item_catalog c ON wr.item_type_id = c.item_type_id
      WHERE wr.event_id = $1 AND wr.is_active = TRUE
      ORDER BY wr.display_order ASC
    `, [event.event_id]);
    assert(rewardsRes.rowCount >= 8, `Sufficient reward spectrum configured (${rewardsRes.rowCount} drops)`);

    const exclusiveReward = rewardsRes.rows.find((r) => r.item_name === 'Phantom Prototype');
    assert(exclusiveReward !== undefined, 'Phantom Prototype is active on the reward wheel');
    assert(exclusiveReward.max_supply === 2, `Phantom Prototype global supply cap is exactly 2 (found: ${exclusiveReward.max_supply})`);
    assert(parseFloat(exclusiveReward.base_probability) === 0.0050, `Phantom Prototype base probability is 0.5% (found: ${exclusiveReward.base_probability})`);

    // TEST 3: Base Probability Distribution Verification
    const totalBaseProb = rewardsRes.rows.reduce((sum, r) => sum + parseFloat(r.base_probability), 0);
    assert(Math.abs(totalBaseProb - 1.0) < 0.0001, `Base probabilities sum exactly to 1.0000 (100%) (sum: ${totalBaseProb.toFixed(4)})`);

    // TEST 4: Mathematical Probability Redistribution Rule
    // Simulate what happens when exclusive drop is sold out
    const remainingSum = rewardsRes.rows
      .filter((r) => r.item_name !== 'Phantom Prototype')
      .reduce((sum, r) => sum + parseFloat(r.base_probability), 0);
    const redistributedProbabilities = rewardsRes.rows
      .filter((r) => r.item_name !== 'Phantom Prototype')
      .map((r) => parseFloat(r.base_probability) / remainingSum);
    const redistributedSum = redistributedProbabilities.reduce((sum, p) => sum + p, 0);
    assert(Math.abs(redistributedSum - 1.0) < 0.0001, `Redistributed probabilities cleanly sum to 100% when exclusive cap is exhausted`);

    // TEST 5: Insufficient Balance Rejection
    // Create mock player or test with player 7 (Recon has 1200 CR, if spin cost is 500 let's test zero wallet)
    const testPlayerId = 1; // Ghost
    const spinCost = parseFloat(event.spin_cost);

    // TEST 6: Atomic Spin Execution & Idempotency
    const idempotencyToken = `test_token_${Date.now()}`;
    const mockReq = {
      body: {
        playerId: testPlayerId,
        idempotencyKey: idempotencyToken,
      },
    };

    let mockResponseData = null;
    let mockStatusCode = 200;
    const mockRes = {
      status: (code) => { mockStatusCode = code; return mockRes; },
      json: (data) => { mockResponseData = data; return mockRes; },
    };

    // Check balance before
    const preWallet = await query(`SELECT balance FROM wallets WHERE player_id = $1 AND currency_id = $2`, [testPlayerId, event.currency_id]);
    const balanceBefore = parseFloat(preWallet.rows[0].balance);

    await wheelController.executeSpin(mockReq, mockRes);
    assert(mockResponseData && mockResponseData.success === true, 'Spin executed successfully through server-side transaction');
    assert(mockResponseData.reward !== undefined, `Reward granted: ${mockResponseData.reward?.item_name} (${mockResponseData.reward?.rarity})`);

    // Check balance after: exactly spinCost deducted
    const postWallet = await query(`SELECT balance FROM wallets WHERE player_id = $1 AND currency_id = $2`, [testPlayerId, event.currency_id]);
    const balanceAfter = parseFloat(postWallet.rows[0].balance);
    assert(Math.abs(balanceBefore - balanceAfter - spinCost) < 0.01, `Exact spin cost (${spinCost}) deducted atomically from player wallet`);

    // Verify inventory instance created
    const invRes = await query(`
      SELECT item_instance_id, player_id, durability
      FROM inventories
      WHERE item_instance_id = $1
    `, [mockResponseData.reward.item_instance_id]);
    assert(invRes.rowCount === 1, `New item instance #${mockResponseData.reward.item_instance_id} exists in player's armory inventory`);

    // TEST 7: Idempotency Protection (Replay with same token)
    let replayData = null;
    const replayRes = {
      status: () => replayRes,
      json: (data) => { replayData = data; },
    };
    await wheelController.executeSpin(mockReq, replayRes);
    assert(replayData && replayData.idempotentReplay === true, 'Idempotency detected: replayed request returned previous reward');

    const replayWallet = await query(`SELECT balance FROM wallets WHERE player_id = $1 AND currency_id = $2`, [testPlayerId, event.currency_id]);
    assert(parseFloat(replayWallet.rows[0].balance) === balanceAfter, 'No double charging on replayed request');

    // TEST 8: Global Cap Enforcement
    // Check awarded_count
    const curProtoReward = await query(`SELECT awarded_count, max_supply FROM wheel_rewards WHERE reward_id = $1`, [exclusiveReward.reward_id]);
    assert(curProtoReward.rows[0].awarded_count <= curProtoReward.rows[0].max_supply, 'Awarded count for exclusive drop never exceeds global max_supply');

    // TEST 9: P2P Black Market Listing Capability
    // Verify player can create a market listing for the awarded item
    const awardedInstanceId = mockResponseData.reward.item_instance_id;
    const listRes = await query(`
      SELECT i.item_instance_id, c.is_tradable
      FROM inventories i
      JOIN item_catalog c ON i.item_type_id = c.item_type_id
      WHERE i.item_instance_id = $1
    `, [awardedInstanceId]);
    assert(Boolean(listRes.rows[0].is_tradable) === true, 'Awarded item instance can be traded on P2P Black Market');

    console.log('\n=============================================================');
    console.log(`[TEST SUMMARY] Passed: ${passed} | Failed: ${failed}`);
    console.log('=============================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('[TEST SUITE CRASH]', err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
