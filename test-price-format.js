// Test script to verify price format handling
const testPriceData = {
  currentSign: '$',
  value: '750000',
  currencyName: 'USD',
};

const jsonPrice = JSON.stringify(testPriceData);
console.log('JSON Price:', jsonPrice);

// Test parsing
try {
  const parsed = JSON.parse(jsonPrice);
  console.log('Parsed Price:', parsed);
  console.log('Value:', parsed.value);
  console.log('Currency:', parsed.currencyName);
  console.log('Sign:', parsed.currentSign);
} catch (e) {
  console.error('Parse Error:', e);
}

// Test with null/empty values
const testCases = [
  null,
  undefined,
  '',
  '0',
  '{"currentSign": "$", "value": "0", "currencyName": "USD"}',
  '{"currentSign": "$", "value": "", "currencyName": "USD"}',
  '{"currentSign": "$", "value": "750000", "currencyName": "USD"}',
  '750000', // Legacy format
];

testCases.forEach((testCase, index) => {
  console.log(`\nTest Case ${index + 1}:`, testCase);

  if (!testCase || testCase === null || testCase === undefined) {
    console.log('Result: Not set');
    return;
  }

  try {
    if (
      typeof testCase === 'string' &&
      testCase.startsWith('{') &&
      testCase.endsWith('}')
    ) {
      const priceData = JSON.parse(testCase);
      if (
        !priceData.value ||
        priceData.value === '0' ||
        priceData.value === ''
      ) {
        console.log('Result: Not set (empty value)');
      } else {
        console.log(
          'Result: Valid price -',
          priceData.currentSign,
          priceData.value,
          priceData.currencyName
        );
      }
    } else {
      const numPrice = parseFloat(testCase);
      if (isNaN(numPrice) || numPrice === 0) {
        console.log('Result: Not set (invalid/zero number)');
      } else {
        console.log('Result: Legacy price - $' + numPrice.toLocaleString());
      }
    }
  } catch (e) {
    console.log('Result: Not set (parse error)');
  }
});
