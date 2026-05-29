# This file represents the hybrid signature of the .tckpkg package.
#
# In a real package, this is a binary blob containing two signatures:
#   1. Ed25519 signature (classical, 64 bytes)
#   2. ML-DSA-65 signature (post-quantum, ~3309 bytes)
#
# Both signatures cover: SHA-256(manifest.yaml || payload.enc)
#
# Verification requires the signer's public keys (Ed25519 + ML-DSA-65).
# The Player verifies BOTH signatures before decrypting the payload.
# If either signature fails, the package is rejected.
#
# Signer identity: did:web:catena-x.net:certification-body
#
# Structure:
#   Bytes 0-63:     Ed25519 signature
#   Bytes 64-3372:  ML-DSA-65 signature
#   Bytes 3373+:    DER-encoded signer certificate chain
#
# This placeholder shows the conceptual layout:

-----BEGIN TESTLAB SIGNATURE-----
Algorithm: Ed25519+ML-DSA-65
Signer: did:web:catena-x.net:certification-body
Signed-At: 2026-05-28T14:00:15Z
Covers: SHA-256(manifest.yaml || payload.enc)

[Ed25519: 64 bytes]
mK8vT2xN4qR7wZ3bF9cH1dJ6nL0pA5sG2iU8yE4tW7oX3mV9kB6fQ1rD5jN0gC=

[ML-DSA-65: 3309 bytes]
aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ0kL1mN2oP3
... (truncated for readability) ...
-----END TESTLAB SIGNATURE-----
