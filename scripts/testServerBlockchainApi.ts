import http from 'http';

function makeRequest(path: string, method = 'GET', body: any = null): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers: body
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(dataString),
            }
          : {},
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(responseData) });
          } catch (e) {
            resolve({ status: res.statusCode || 500, body: responseData });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(dataString);
    req.end();
  });
}

async function runApiTests() {
  console.log("=== TESTING SERVER BLOCKCHAIN API & ERROR HANDLING ===\n");

  // 1. GET /api/blockchain/status
  const statusRes = await makeRequest('/api/blockchain/status');
  console.log("1. GET /api/blockchain/status response:");
  console.log("   Status code:", statusRes.status);
  console.log("   Connected:", statusRes.body.connected);
  console.log("   Network:", statusRes.body.network);
  console.log("   Chain ID:", statusRes.body.chainId);
  console.log("   Status Message:", statusRes.body.statusMessage);

  // 2. GET /api/blockchain/stats
  const statsRes = await makeRequest('/api/blockchain/stats');
  console.log("\n2. GET /api/blockchain/stats response:");
  console.log("   Status code:", statsRes.status);
  console.log("   isLiveRpc:", statsRes.body.network?.isLiveRpc);
  console.log("   Status Message:", statsRes.body.network?.statusMessage);

  // 3. Attempting on-chain transaction when unconfigured
  const createTaskRes = await makeRequest('/api/tasks', 'POST', {
    title: 'Test Unconfigured Transaction Task',
    assetId: 'ASSET-PUMP-07',
  });
  console.log("\n3. POST /api/tasks (triggers real on-chain createTask):");
  console.log("   Status code:", createTaskRes.status);
  console.log("   Success:", createTaskRes.body.success);
  console.log("   Error:", createTaskRes.body.error);

  if (!createTaskRes.body.success && createTaskRes.body.error?.includes('MST NOT CONFIGURED')) {
    console.log("   ✓ PASSED: System correctly halted on-chain transaction and reported 'MST NOT CONFIGURED' without creating fake transactions.");
  } else {
    console.log("   Result:", createTaskRes.body);
  }

  console.log("\n=== ALL SERVER BLOCKCHAIN API TESTS COMPLETED ===");
}

runApiTests().catch(console.error);
