# Onefa

Simple web app for managing TOTP keys and codes

## Operating Onefa

Onefa depends on:
- A Keycloak authentication server
- A Postgres database

Pass the following environment variables to the Onefa Docker container:
- `DATABASE_URL`: connection string to the Postgres database
- `AUTH_SERVER_URL`: public URL of the Keycloak server
- `APP_URL`: public URL of Onefa's deployment

If running uncontainerized, pass the following additional environment variables:
- `STATIC_FILE_ROOT`: path to frontend bundles
