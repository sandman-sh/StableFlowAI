// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentRegistry {
    struct Agent {
        string agentId;
        string name;
        address walletAddress;
        string organizationId;
        uint256 registeredAt;
    }

    mapping(string => Agent) private agents;
    mapping(address => string) private walletToAgentId;
    string[] private agentIds;

    event AgentRegistered(
        string indexed agentId,
        string name,
        address indexed walletAddress,
        string organizationId
    );

    function registerAgent(
        string memory _agentId,
        string memory _name,
        address _walletAddress,
        string memory _organizationId
    ) public {
        require(bytes(_agentId).length > 0, "Agent ID cannot be empty");
        require(_walletAddress != address(0), "Invalid wallet address");
        
        agents[_agentId] = Agent({
            agentId: _agentId,
            name: _name,
            walletAddress: _walletAddress,
            organizationId: _organizationId,
            registeredAt: block.timestamp
        });

        walletToAgentId[_walletAddress] = _agentId;
        agentIds.push(_agentId);

        emit AgentRegistered(_agentId, _name, _walletAddress, _organizationId);
    }

    function getAgent(string memory _agentId) public view returns (
        string memory agentId,
        string memory name,
        address walletAddress,
        string memory organizationId,
        uint256 registeredAt
    ) {
        Agent memory agent = agents[_agentId];
        require(agent.walletAddress != address(0), "Agent not found");
        return (
            agent.agentId,
            agent.name,
            agent.walletAddress,
            agent.organizationId,
            agent.registeredAt
        );
    }

    function getAgentIdByWallet(address _wallet) public view returns (string memory) {
        return walletToAgentId[_wallet];
    }

    function totalAgents() public view returns (uint256) {
        return agentIds.length;
    }
}
