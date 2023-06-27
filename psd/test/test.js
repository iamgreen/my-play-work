const assert = require('assert');
const { processNode } = require('../src/utils');

async function testProcessNode() {
  const testNode = {
    name: 'Test',
    children: [],
    width: 100,
    height: 100,
    left: 10,
    top: 20,
    opacity: 255,
  };

  const result = await processNode(testNode, null);
  assert.strictEqual(result.html, '<div class="layer-Test"></div>');
  assert.strictEqual(
    result.style,
    `
.layer-Test {
  position: absolute;
  width: 100px;
  height: 100px;
  left: 10px;
  top: 20px;
  background-image: url('output/Test.png');
  background-size: cover;
  opacity: 1;
}
`,
  );

  console.log('testProcessNode passed');
}

async function runTests() {
    await testProcessNode();    
    // 在此处添加其他测试用例
}
runTests();