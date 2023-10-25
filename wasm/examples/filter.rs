#[derive(Clone)]
#[no_mangle]
pub struct Event {
    id: String,
    pubkey: String,
    created_at: i64, // unix timestamp in seconds
    kind: i32,
    tags: Vec<Vec<String>>,
    content: String,
    sig: String,
}

#[no_mangle]
pub fn isValidEvent(event: Event) -> bool {
    event.kind == 1
}
