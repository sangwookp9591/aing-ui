use serde_json::{Value, json};
use std::{env, fs, path::PathBuf};

fn main() {
    let root = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap()).join("..");
    println!("cargo:rerun-if-changed=../registry.json");
    println!("cargo:rerun-if-changed=../registry/aing");
    let mut registry: Value =
        serde_json::from_str(&fs::read_to_string(root.join("registry.json")).unwrap()).unwrap();
    println!("cargo:rerun-if-changed=catalog.json");
    let catalog: Value =
        serde_json::from_str(&fs::read_to_string(root.join("cli/catalog.json")).unwrap()).unwrap();
    for item in registry["items"].as_array_mut().unwrap() {
        let name = item["name"].as_str().unwrap().trim_end_matches("-tailwind");
        item["metadata"] = catalog[name].clone();
        for file in item["files"].as_array_mut().unwrap() {
            let path = file["path"].as_str().unwrap();
            file["content"] = json!(fs::read_to_string(root.join(path)).unwrap());
        }
    }
    registry["tokens"] =
        json!(fs::read_to_string(root.join("registry/aing/css/tokens.css")).unwrap());
    fs::write(
        PathBuf::from(env::var("OUT_DIR").unwrap()).join("registry.json"),
        registry.to_string(),
    )
    .unwrap();
}
