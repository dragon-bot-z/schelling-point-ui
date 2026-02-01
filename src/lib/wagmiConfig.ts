import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Schelling Point',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'demo',
  chains: [base, baseSepolia],
  ssr: true,
});

// Schelling Point contract address (Base Sepolia testnet - to be deployed)
export const SCHELLING_POINT_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

// Contract ABI
export const SCHELLING_POINT_ABI = [
  // View functions
  {
    name: 'currentRoundId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getPhase',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [{ type: 'uint8' }], // Phase enum
  },
  {
    name: 'getRound',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [
      { name: 'theme', type: 'string' },
      { name: 'entryFee', type: 'uint256' },
      { name: 'commitDeadline', type: 'uint256' },
      { name: 'revealDeadline', type: 'uint256' },
      { name: 'totalPot', type: 'uint256' },
      { name: 'playerCount', type: 'uint256' },
      { name: 'settled', type: 'bool' },
    ],
  },
  {
    name: 'hasCommitted',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'player', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'hasRevealed',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'player', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'getCommitHash',
    type: 'function',
    stateMutability: 'pure',
    inputs: [
      { name: 'answer', type: 'string' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  // Write functions
  {
    name: 'commit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'commitHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'reveal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'answer', type: 'string' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [],
  },
] as const;

// Phase enum matching the contract
export enum Phase {
  Inactive = 0,
  Commit = 1,
  Reveal = 2,
  Complete = 3,
}
