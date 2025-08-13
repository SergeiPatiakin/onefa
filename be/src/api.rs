// Code related to the Onefa API
use http_body_util::BodyExt;
use http_body_util::Full;
use hyper::{Response, StatusCode, body::Bytes};
use serde::{Deserialize, Serialize};

use crate::hyper_utils::HyperRequest;
use crate::hyper_utils::HyperResponse;
use crate::{
    auth::verify_auth_claims,
    db::prepare_postgres_client,
    error::{OnefaError, to_generic_error},
};

#[derive(Serialize, Deserialize, Debug, Clone)]
struct TotpKey {
    id: String,
    name: String,
    key: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct TotpKeyRef {
    id: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct ReadTotpKeysResbody {
    totp_keys: Vec<TotpKey>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct WriteTotpKeyResbody {
    affected: Vec<TotpKeyRef>,
}

pub async fn handle_read_totp_keys(request: HyperRequest) -> Result<HyperResponse, OnefaError> {
    let auth_claims = verify_auth_claims(&request).await?;
    println!("User ID: {}", auth_claims.sub);
    let client = prepare_postgres_client().await?;

    let rows = client
        .query(
            "SELECT id, user_id, name, key FROM totp_keys WHERE user_id=$1",
            &[&auth_claims.sub],
        )
        .await?;
    let resbody = ReadTotpKeysResbody {
        totp_keys: rows
            .iter()
            .map(|row| TotpKey {
                id: row.get::<usize, i64>(0).to_string(),
                // Skip user_id: row.get(1),
                name: row.get(2),
                key: row.get(3),
            })
            .collect(),
    };

    let resbody_bytes = serde_json::to_vec(&resbody).map_err(to_generic_error)?;
    let response = Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(resbody_bytes)))
        .unwrap();
    Ok(response)
}

pub async fn handle_update_totp_key(request: HyperRequest) -> Result<HyperResponse, OnefaError> {
    let auth_claims = verify_auth_claims(&request).await?;
    println!("User ID: {}", auth_claims.sub);

    let body_bytes = request
        .collect()
        .await
        .map_err(to_generic_error)?
        .to_bytes();
    let reqbody: TotpKey =
        serde_json::from_slice(&body_bytes).map_err(|_| OnefaError::BadRequest)?;
    let reqbody_totp_key_id: i64 = reqbody.id.parse().map_err(|_| OnefaError::BadRequest)?;
    let client = prepare_postgres_client().await?;

    let rows = client
        .query(
            "UPDATE totp_keys SET name=$3, key=$4 WHERE user_id=$1 AND id=$2 RETURNING id",
            &[
                &auth_claims.sub,
                &reqbody_totp_key_id,
                &reqbody.name,
                &reqbody.key,
            ],
        )
        .await?;
    let resbody = WriteTotpKeyResbody {
        affected: rows
            .iter()
            .map(|row| TotpKeyRef {
                id: row.get::<usize, i64>(0).to_string(),
            })
            .collect(),
    };

    let resbody_bytes = serde_json::to_vec(&resbody).map_err(to_generic_error)?;
    let response = Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(resbody_bytes)))
        .unwrap();
    Ok(response)
}

pub async fn handle_create_totp_key(request: HyperRequest) -> Result<HyperResponse, OnefaError> {
    let auth_claims = verify_auth_claims(&request).await?;
    println!("User ID: {}", auth_claims.sub);

    let body_bytes = request
        .collect()
        .await
        .map_err(to_generic_error)?
        .to_bytes();
    let totp_key: TotpKey =
        serde_json::from_slice(&body_bytes).map_err(|_| OnefaError::BadRequest)?;
    let client = prepare_postgres_client().await?;

    let rows = client
        .query(
            "INSERT INTO totp_keys(user_id, name, key) VALUES ($1, $2, $3) RETURNING id",
            &[&auth_claims.sub, &totp_key.name, &totp_key.key],
        )
        .await?;
    let resbody = WriteTotpKeyResbody {
        affected: rows
            .iter()
            .map(|row| TotpKeyRef {
                id: row.get::<usize, i64>(0).to_string(),
            })
            .collect(),
    };

    let resbody_bytes = serde_json::to_vec(&resbody).map_err(to_generic_error)?;
    let response = Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(resbody_bytes)))
        .unwrap();
    Ok(response)
}

pub async fn handle_delete_totp_key(request: HyperRequest) -> Result<HyperResponse, OnefaError> {
    let auth_claims = verify_auth_claims(&request).await?;
    println!("User ID: {}", auth_claims.sub);

    let body_bytes = request
        .collect()
        .await
        .map_err(to_generic_error)?
        .to_bytes();
    let reqbody: TotpKeyRef =
        serde_json::from_slice(&body_bytes).map_err(|_| OnefaError::BadRequest)?;
    let reqbody_totp_key_id: i64 = reqbody.id.parse().map_err(|_| OnefaError::BadRequest)?;
    let client = prepare_postgres_client().await?;

    let rows = client
        .query(
            "DELETE FROM totp_keys WHERE user_id=$1 AND id=$2 RETURNING id",
            &[&auth_claims.sub, &reqbody_totp_key_id],
        )
        .await?;
    let resbody = WriteTotpKeyResbody {
        affected: rows
            .iter()
            .map(|row| TotpKeyRef {
                id: row.get::<usize, i64>(0).to_string(),
            })
            .collect(),
    };

    let resbody_bytes = serde_json::to_vec(&resbody).map_err(to_generic_error)?;
    let response = Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(resbody_bytes)))
        .unwrap();
    Ok(response)
}
