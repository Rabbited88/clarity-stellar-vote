# StellarVote

A secure and transparent blockchain-based voting platform built on the Stacks network. This contract implements a decentralized voting system that allows:

- Election administrators to create and manage elections
- Voters to securely cast their votes
- Real-time vote counting and result verification
- Prevention of double voting
- Vote privacy and security

## Features

- Create new elections with customizable candidates
- Register eligible voters
- Secure vote casting mechanism
- Real-time vote tallying
- Election status tracking
- Vote verification system
- Manual election ending by administrator

## Security

- Only registered voters can participate
- One vote per voter per election
- Immutable vote records
- Transparent vote counting
- Elections can be explicitly ended by administrator

## Changes in Latest Version

- Added ability for contract owner to manually end elections using the `end-election` function
- Enhanced election status tracking
- Added test coverage for election ending functionality
