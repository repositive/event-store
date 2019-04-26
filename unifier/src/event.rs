use chrono::prelude::*;
use serde_derive::{Deserialize, Serialize};
use uuid::Uuid;

/// Event data
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EventData {
    pub event_namespace: String,
    pub event_type: String,

    #[serde(flatten)]
    pub payload: serde_json::Value,
}

/// Event context
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EventContext {
    pub action: Option<String>,

    /// Optional event "subject" or metadata
    pub subject: Option<serde_json::Value>,

    /// Event creation time
    pub time: DateTime<Utc>,
}

/// An event
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Event {
    pub id: Uuid,
    pub data: EventData,
    pub context: EventContext,
}
