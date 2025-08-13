// Code related to the Hyper web framework
use http_body_util::Full;
use hyper::{Request, Response, body::Bytes};

pub type HyperRequest = Request<hyper::body::Incoming>;
pub type HyperResponse = Response<Full<Bytes>>;
