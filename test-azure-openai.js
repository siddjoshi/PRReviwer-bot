// test-azure-openai.js
// Simple test script to validate Azure OpenAI configuration
require('dotenv').config();
const AzureOpenAIService = require('./azureOpenAI');

async function testAzureOpenAI() {
  console.log("Testing Azure OpenAI configuration...");
  
  // Check environment variables
  const requiredVars = [
    'AZURE_OPENAI_API_KEY',
    'AZURE_OPENAI_ENDPOINT',
    'AZURE_OPENAI_DEPLOYMENT_NAME'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:", missing);
    console.log("Please set these in your .env file:");
    missing.forEach(varName => console.log(`  ${varName}=your_value`));
    return;
  }
  
  console.log("✅ All required environment variables are set");
  
  try {
    const azureOpenAI = new AzureOpenAIService();
    
    // Test with a simple code review
    const mockChanges = [{
      filename: 'test.js',
      status: 'added',
      additions: 10,
      deletions: 0,
      patch: `@@ -0,0 +1,10 @@
+function calculateTotal(items) {
+  let total = 0;
+  for (let i = 0; i < items.length; i++) {
+    total += items[i].price;
+  }
+  return total;
+}
+
+module.exports = calculateTotal;`
    }];
    
    const mockPRInfo = {
      title: "Add calculateTotal function",
      body: "This function calculates the total price of items",
      user: { login: "testuser" }
    };
    
    console.log("🔄 Sending test request to Azure OpenAI...");
    const review = await azureOpenAI.reviewCode(mockChanges, mockPRInfo);
    
    console.log("✅ Azure OpenAI connection successful!");
    console.log("\n📝 Sample review response:");
    console.log("─".repeat(50));
    console.log(review.substring(0, 300) + "...");
    console.log("─".repeat(50));
    
  } catch (error) {
    console.error("❌ Azure OpenAI test failed:");
    console.error("Error:", error.message);
    
    if (error.message.includes('401')) {
      console.log("\n💡 This looks like an authentication error. Please check:");
      console.log("  - AZURE_OPENAI_API_KEY is correct");
      console.log("  - Your Azure OpenAI resource is active");
    } else if (error.message.includes('404')) {
      console.log("\n💡 This looks like a resource not found error. Please check:");
      console.log("  - AZURE_OPENAI_ENDPOINT is correct");
      console.log("  - AZURE_OPENAI_DEPLOYMENT_NAME exists in your resource");
    }
  }
}

// Run the test
if (require.main === module) {
  testAzureOpenAI().catch(console.error);
}

module.exports = testAzureOpenAI;
