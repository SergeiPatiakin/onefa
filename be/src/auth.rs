// Code related to OIDC authentication
use std::time::Duration;

use hyper::Request;
use serde::{Deserialize, Serialize};
use tokio::sync::OnceCell;

use crate::{config::get_onefa_config, error::OnefaError};

// Keycloak client ID used by the Onefa frontend. Only tokens issued to this client are accepted.
const ONEFA_CLIENT_ID: &str = "1fa";

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub exp: u64,
    pub azp: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct OidcCertsKey {
    alg: String,
    n: String,
    e: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct OidcCertsResbody {
    keys: Vec<OidcCertsKey>,
}

static DECODING_KEY: OnceCell<jsonwebtoken::DecodingKey> = OnceCell::const_new();
async fn get_decoding_key() -> &'static jsonwebtoken::DecodingKey {
    DECODING_KEY
        .get_or_init(async || {
            let url = format!(
                "{}/realms/mimram/protocol/openid-connect/certs",
                get_onefa_config().auth_server_url
            );
            loop {
                let result = reqwest::get(&url).await;
                let Ok(response) = result else {
                    println!("Auth server request error, backing off: {result:?}");
                    tokio::time::sleep(Duration::from_millis(5000)).await;
                    continue;
                };
                if response.status().as_u16() != 200 {
                    println!("Auth server body status error, backing off");
                    tokio::time::sleep(Duration::from_millis(5000)).await;
                    continue;
                }
                let Ok(resbytes) = response.bytes().await else {
                    println!("Auth server body read error, backing off");
                    tokio::time::sleep(Duration::from_millis(5000)).await;
                    continue;
                };
                let Ok(resbody) = serde_json::from_slice::<OidcCertsResbody>(&resbytes) else {
                    println!("Auth server body decode error, backing off");
                    tokio::time::sleep(Duration::from_millis(5000)).await;
                    continue;
                };
                let Some(resbody_key) = resbody.keys.iter().find(|&k| k.alg == "RS256") else {
                    println!("Auth server key find error, backing off");
                    tokio::time::sleep(Duration::from_millis(5000)).await;
                    continue;
                };
                let Ok(decoding_key) =
                    jsonwebtoken::DecodingKey::from_rsa_components(&resbody_key.n, &resbody_key.e)
                else {
                    println!("Auth server key decode error, backing off");
                    tokio::time::sleep(Duration::from_millis(5000)).await;
                    continue;
                };
                println!("Got server public key: {resbody_key:?}");
                break decoding_key;
            }
        })
        .await
}

// Returns verified claims. The exp field contains the verified user ID.
pub async fn verify_auth_claims(
    request: &Request<hyper::body::Incoming>,
) -> Result<Claims, OnefaError> {
    let Some(authorization_header) = request.headers().get("Authorization") else {
        return Err(OnefaError::Unauthorized);
    };

    let authorization_header_parts: Vec<&str> = authorization_header
        .to_str()
        .map_err(|_e| OnefaError::Unauthorized)?
        .split_ascii_whitespace()
        .collect();
    if authorization_header_parts.len() != 2 {
        return Err(OnefaError::Unauthorized);
    }
    if authorization_header_parts[0] != "Bearer" {
        return Err(OnefaError::Unauthorized);
    }
    let jwt = authorization_header_parts[1];

    let mut validation = jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::RS256);
    validation.set_audience(&["account"]);

    let token_data = jsonwebtoken::decode::<Claims>(jwt, get_decoding_key().await, &validation)
        .map_err(|_e| OnefaError::Unauthorized)?;

    if token_data.claims.azp != ONEFA_CLIENT_ID {
        println!(
            "Rejected token issued to client {:?} (sub {})",
            token_data.claims.azp, token_data.claims.sub
        );
        return Err(OnefaError::Unauthorized);
    }
    Ok(token_data.claims)
}
