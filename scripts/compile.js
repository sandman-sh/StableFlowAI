const fs = require('fs');
const path = require('path');
const solc = require('solc');

const contractPath = path.resolve(__dirname, '../contracts', 'AgentRegistry.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'AgentRegistry.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  output.errors.forEach(err => console.error(err.formattedMessage));
}

const contract = output.contracts['AgentRegistry.sol']['AgentRegistry'];

const artifact = {
  abi: contract.abi,
  bytecode: contract.evm.bytecode.object,
};

fs.writeFileSync(
  path.resolve(__dirname, '../contracts', 'AgentRegistry.json'),
  JSON.stringify(artifact, null, 2)
);

console.log('Compiled successfully! Saved to contracts/AgentRegistry.json');
