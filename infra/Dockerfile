# ---- Frontend build stage ----
FROM node:22-trixie AS fe-builder
COPY fe fe
RUN cd fe && npm ci && npm run build

# ---- Backend build stage ----
FROM rust:1.88-trixie AS be-builder
WORKDIR /app
COPY be/Cargo.toml be/Cargo.lock ./
COPY be/src ./src
RUN cargo build --release

# ---- Runtime stage ----
FROM debian:trixie-slim
RUN apt update && apt install -y ca-certificates
# Copy binary from backend build stage
COPY --from=be-builder /app/target/release/onefa /usr/bin/onefa
# Copy bundle from frontend build stage
COPY --from=fe-builder fe/dist /static
ENV STATIC_FILE_ROOT=/static
EXPOSE 3000
CMD ["onefa"]
