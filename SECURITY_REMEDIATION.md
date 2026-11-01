# Security remediation notes

These changes are on the `security/fixes-2026-11` branch. Do not merge or deploy until the configuration and integration checks below are completed.

## Required environment variables

- `JWT_SECRET`: generate a new cryptographically random secret of at least 32 characters. Configure the same secret in the API and the JWT verification service. Rotate it; do not reuse the value previously committed.
- `BLOCKCHAIN_DEPLOY_ENROLL_SECRET`: provide the rotated enrollment secret for the deployment identity. It is no longer read from `config/default.json`.
- `JWT_AUTH_ENDPOINT`: optional HTTPS URL for the JWT service. If omitted, the application uses the existing service hostname over HTTPS. Confirm that the service supports HTTPS and that its certificate validates before deployment.

The two tracked credential JSON files under `config/credentials/` have been removed from this branch, and the embedded registrar/deployment secrets were removed from `config/default.json`. The registrar credentials are supplied by the blockchain service binding (`VCAP_SERVICES`); keep that binding outside source control and rotate credentials that were previously committed or logged. These deletions do not erase secrets from earlier Git commits.

## Behavior changes requiring integration work

- The global authentication middleware no longer exempts crash notifications or the vehicle valuation oracle route. The current middleware requires a `:username` route parameter, which those routes do not have. They will fail closed with HTTP 401 until a dedicated machine-to-machine authentication mechanism is implemented for the crash sensor and oracle callers.
- Do not restore unauthenticated route exemptions. Implement signed service requests (with timestamp, expiry and replay protection) or a dedicated service identity before enabling those integrations.
- The oracle callback function is fixed to `vehicleValueOracleCallback`; clients can no longer choose an arbitrary chaincode function.
- The external JWT service still receives the signing secret over HTTPS. Prefer migrating to local JWT signing or a supported identity provider with asymmetric signing and key rotation.

## Verification required before merge

1. Install dependencies in a compatible, isolated build environment.
2. Run the existing unit/integration tests and Go chaincode tests.
3. Add regression tests for missing/invalid bearer tokens, spoofed Origin headers, cross-customer payout attempts, missing certificate attributes, and malformed multi-party claim arguments.
4. Test the crash notification and oracle service-auth flows with their intended callers.
5. Run dependency scanning, secret scanning (including Git history), and a security review of the remaining chaincode entry points.
6. Rotate/revoke all previously committed credentials. Removing a secret from the current file does not remove it from Git history.
