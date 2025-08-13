// Code related to error handling
use http_body_util::Full;
use hyper::body::Bytes;
use hyper::{Response, StatusCode};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum OnefaError {
    #[error("{0}")]
    Generic(String),
    #[error(transparent)]
    Postgres(#[from] tokio_postgres::Error),
    #[error("Unauthorized")]
    Unauthorized,
    #[error("BadRequest")]
    BadRequest,
    #[error("NotFound")]
    NotFound,
}
impl OnefaError {
    pub fn to_response(&self) -> Response<Full<Bytes>> {
        let mut error_response = Response::new(Full::new(Bytes::from("")));
        *error_response.status_mut() = match self {
            Self::Unauthorized => StatusCode::UNAUTHORIZED,
            Self::BadRequest => StatusCode::BAD_REQUEST,
            Self::NotFound => StatusCode::NOT_FOUND,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };
        error_response
    }
}

pub fn to_generic_error(value: impl ToString) -> OnefaError {
    OnefaError::Generic(value.to_string())
}
