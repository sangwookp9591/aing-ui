use serde_json::{Value, json};
use std::{
    fs,
    path::Path,
    process::{Command, Output},
};
fn run(root: &Path, args: &[&str]) -> Output {
    Command::new(env!("CARGO_BIN_EXE_aing"))
        .arg("--cwd")
        .arg(root)
        .args(args)
        .output()
        .unwrap()
}
fn ok(root: &Path, args: &[&str]) -> Value {
    let output = run(root, args);
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    serde_json::from_slice(&output.stdout).unwrap()
}
fn fixture() -> tempfile::TempDir {
    let root = tempfile::tempdir().unwrap();
    fs::create_dir_all(root.path().join("src")).unwrap();
    fs::write(
        root.path().join("src/main.tsx"),
        "export const app = <main />;\n",
    )
    .unwrap();
    fs::write(
        root.path().join("package.json"),
        json!({"name":"fixture","dependencies":{"react":"19.3.1","vite":"8.3.4"}}).to_string(),
    )
    .unwrap();
    // Unit fixture only: real package-manager installation is covered by the Next/Vite acceptance apps.
    fs::create_dir_all(root.path().join("node_modules/@aing/core")).unwrap();
    fs::write(
        root.path().join("node_modules/@aing/core/package.json"),
        r#"{"version":"0.1.0"}"#,
    )
    .unwrap();
    root
}
fn registry(root: &Path, code: &str) {
    let item = json!({"name":"button","type":"registry:ui","tags":["action"],"aliases":["버튼"],"files":[{"path":"registry/aing/ui/button.tsx","content":code}],"css":{"@layer aing":{".custom-button":{"color":"var(--primary)"}}}});
    fs::write(
        root.join("registry.json"),
        json!({"components":[item]}).to_string(),
    )
    .unwrap();
}
#[test]
fn dry_run_is_read_only_and_css_merge_preserves_theme_edit() {
    let root = fixture();
    registry(root.path(), "export const Button = () => <button />;\n");
    ok(root.path(), &["init", "--registry", "registry.json"]);
    let before = fs::read(root.path().join(".aing/lock.json")).unwrap();
    let css = fs::read(root.path().join("src/aing.css")).unwrap();
    ok(root.path(), &["add", "BUTTON", "--dry-run"]);
    assert!(!root.path().join("src/components/ui/button.tsx").exists());
    assert_eq!(
        fs::read(root.path().join(".aing/lock.json")).unwrap(),
        before
    );
    assert_eq!(fs::read(root.path().join("src/aing.css")).unwrap(), css);
    let edited = String::from_utf8(css)
        .unwrap()
        .replace("--primary: #18181b;", "--primary: rebeccapurple;");
    fs::write(root.path().join("src/aing.css"), edited).unwrap();
    ok(root.path(), &["add", "버튼"]);
    let installed = fs::read_to_string(root.path().join("src/aing.css")).unwrap();
    assert!(installed.contains("--primary: rebeccapurple;"));
    ok(root.path(), &["add", "button"]);
    assert_eq!(
        fs::read_to_string(root.path().join("src/aing.css")).unwrap(),
        installed
    );
    ok(root.path(), &["check"]);
}
#[test]
fn sync_preserves_local_edits_and_fails_visibly_on_overlap() {
    let root = fixture();
    let base = "export const local = 1;\nexport const keep1 = 1;\nexport const keep2 = 1;\nexport const keep3 = 1;\nexport const keep4 = 1;\nexport const upstream = 1;\n";
    registry(root.path(), base);
    ok(root.path(), &["init", "--registry", "registry.json"]);
    ok(root.path(), &["add", "button"]);
    let file = root.path().join("src/components/ui/button.tsx");
    fs::write(&file, base.replace("local = 1", "local = 2")).unwrap();
    registry(root.path(), &base.replace("upstream = 1", "upstream = 2"));
    ok(root.path(), &["sync"]);
    let merged = fs::read_to_string(&file).unwrap();
    assert!(merged.contains("local = 2") && merged.contains("upstream = 2"));
    registry(
        root.path(),
        &base
            .replace("local = 1", "local = 3")
            .replace("upstream = 1", "upstream = 2"),
    );
    let output = run(root.path(), &["sync"]);
    assert!(!output.status.success());
    assert!(fs::read_to_string(&file).unwrap().contains("<<<<<<<"));
    let markers = fs::read(&file).unwrap();
    assert!(!run(root.path(), &["sync"]).status.success());
    assert_eq!(fs::read(&file).unwrap(), markers);
    fs::write(
        &file,
        base.replace("local = 1", "local = 2")
            .replace("upstream = 1", "upstream = 2"),
    )
    .unwrap();
    ok(root.path(), &["sync"]);
    assert!(fs::read_to_string(&file).unwrap().contains("local = 2"));
}
#[test]
fn registry_cannot_escape_project_and_modified_files_are_protected() {
    let root = fixture();
    registry(root.path(), "export const Button = 1;\n");
    ok(root.path(), &["init", "--registry", "registry.json"]);
    ok(root.path(), &["add", "button"]);
    let file = root.path().join("src/components/ui/button.tsx");
    fs::write(&file, "export const Button = 2;\n").unwrap();
    assert!(!run(root.path(), &["add", "button"]).status.success());
    assert_eq!(
        fs::read_to_string(&file).unwrap(),
        "export const Button = 2;\n"
    );
    let mut value: Value =
        serde_json::from_str(&fs::read_to_string(root.path().join("registry.json")).unwrap())
            .unwrap();
    value["components"][0]["files"][0]["target"] = json!("../escape.tsx");
    fs::write(root.path().join("registry.json"), value.to_string()).unwrap();
    assert!(
        !run(root.path(), &["add", "button", "--overwrite"])
            .status
            .success()
    );
}
#[test]
fn shadcn_recursive_files_relocate_relative_and_alias_imports() {
    let root = fixture();
    let value = json!({"items":[{"name":"x","type":"registry:ui","registryDependencies":["helper"],"files":[{"path":"registry/aing/ui/x.tsx","content":"export {helper} from '../lib/helper'; export {helper as other} from '@/registry/aing/lib/helper';"}]},{"name":"helper","type":"registry:lib","files":[{"path":"registry/aing/lib/helper.ts","target":"lib/helper.ts","content":"export const helper = 1;"}]}]});
    fs::write(root.path().join("registry.json"), value.to_string()).unwrap();
    ok(root.path(), &["init", "--registry", "registry.json"]);
    ok(root.path(), &["add", "x"]);
    let source = fs::read_to_string(root.path().join("src/components/ui/x.tsx")).unwrap();
    assert_eq!(source.matches("../../lib/helper").count(), 2);
    ok(root.path(), &["check"]);
}

#[test]
fn sync_installs_new_upstream_files_and_retains_removed_files() {
    let root = fixture();
    registry(root.path(), "export const Button = 1;\n");
    ok(root.path(), &["init", "--registry", "registry.json"]);
    ok(root.path(), &["add", "button"]);
    let mut value: Value =
        serde_json::from_str(&fs::read_to_string(root.path().join("registry.json")).unwrap())
            .unwrap();
    value["components"][0]["files"] =
        json!([{"path":"registry/aing/ui/new-button.tsx","content":"export const NewButton = 1;"}]);
    fs::write(root.path().join("registry.json"), value.to_string()).unwrap();
    let output = ok(root.path(), &["sync"]);
    assert!(
        root.path()
            .join("src/components/ui/new-button.tsx")
            .exists()
    );
    assert!(root.path().join("src/components/ui/button.tsx").exists());
    assert_eq!(
        output["retained_removed_files"],
        json!(["src/components/ui/button.tsx"])
    );
}

#[test]
fn tailwind_style_has_one_token_set_and_persists_its_identity_for_sync() {
    let root = fixture();
    let package = root.path().join("package.json");
    let mut value: Value = serde_json::from_str(&fs::read_to_string(&package).unwrap()).unwrap();
    value["devDependencies"] = json!({"tailwindcss":"4.3.3"});
    fs::write(package, value.to_string()).unwrap();
    ok(root.path(), &["init", "--style", "tailwind"]);
    let added = ok(root.path(), &["add", "button"]);
    assert_eq!(added["style"], "tailwind");
    let css = fs::read_to_string(root.path().join("src/aing.css")).unwrap();
    assert_eq!(css.matches("--primary:").count(), 2);
    let source = fs::read_to_string(root.path().join("src/components/ui/button.tsx")).unwrap();
    // 특정 클래스 문자열 대신 판 구분만 본다: Tailwind판은 유틸리티(focus-visible:)를 쓰고
    // CSS판 전용 클래스(aing-button)가 없다. 버튼 모양이 바뀌어도 깨지지 않게.
    assert!(source.contains("focus-visible:") && !source.contains("aing-button"));
    ok(root.path(), &["sync"]);
    assert_eq!(
        fs::read_to_string(root.path().join("src/components/ui/button.tsx")).unwrap(),
        source
    );
}

#[test]
fn explicit_style_switch_updates_diff_and_sync_tracking() {
    let root = fixture();
    let package = root.path().join("package.json");
    let mut value: Value = serde_json::from_str(&fs::read_to_string(&package).unwrap()).unwrap();
    value["devDependencies"] = json!({"tailwindcss":"4.3.3"});
    fs::write(package, value.to_string()).unwrap();
    ok(root.path(), &["init"]);
    ok(root.path(), &["add", "button"]);
    ok(
        root.path(),
        &["add", "button", "--style", "tailwind", "--overwrite"],
    );
    let lock: Value =
        serde_json::from_str(&fs::read_to_string(root.path().join(".aing/lock.json")).unwrap())
            .unwrap();
    assert!(lock["items"]["button"].is_null());
    assert!(lock["items"]["button-tailwind"].is_object());
    let diffs = ok(root.path(), &["diff", "button"]);
    assert!(
        diffs
            .as_object()
            .unwrap()
            .values()
            .all(|diff| diff.as_str().unwrap().is_empty())
    );
    ok(root.path(), &["sync"]);
}
