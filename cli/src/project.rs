use crate::{
    registry::{Registry, strings, valid_dependency},
    transform,
};
use anyhow::{Context, Result, bail, ensure};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    io::Write,
    path::{Component, Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Clone, Deserialize, Serialize)]
pub struct Config {
    pub registry: String,
    pub style: String,
    pub framework: String,
    pub src: bool,
    pub tailwind: bool,
    pub package_manager: String,
    pub aliases: BTreeMap<String, String>,
    pub paths: BTreeMap<String, String>,
    pub entry: String,
    pub css: String,
}
pub fn safe_path(root: &Path, relative: &str) -> Result<PathBuf> {
    ensure!(
        !relative.is_empty() && !relative.contains(['\\', ':']),
        "invalid project path: {relative}"
    );
    let path = Path::new(relative);
    ensure!(
        path.components()
            .all(|part| matches!(part, Component::Normal(_))),
        "path escapes project: {relative}"
    );
    let mut full = root.to_path_buf();
    for part in path.components() {
        full.push(part);
        if let Ok(metadata) = fs::symlink_metadata(&full) {
            ensure!(
                !metadata.file_type().is_symlink(),
                "refusing symlink: {}",
                full.display()
            );
        }
    }
    Ok(full)
}
fn read(root: &Path, relative: &str) -> Result<String> {
    Ok(fs::read_to_string(safe_path(root, relative)?)?)
}
fn exists(root: &Path, relative: &str) -> bool {
    root.join(relative).is_file()
}
fn json_file(root: &Path, relative: &str) -> Result<Value> {
    Ok(serde_json::from_str(&read(root, relative)?)?)
}
fn write(root: &Path, relative: &str, content: &str) -> Result<()> {
    let path = safe_path(root, relative)?;
    fs::create_dir_all(path.parent().context("missing parent")?)?;
    let temp = path.with_file_name(format!(
        ".aing-{}-{}.tmp",
        std::process::id(),
        SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos()
    ));
    let result = (|| -> Result<()> {
        let mut file = fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temp)?;
        file.write_all(content.as_bytes())?;
        file.sync_all()?;
        fs::rename(&temp, &path)?;
        Ok(())
    })();
    if temp.exists() {
        let _ = fs::remove_file(temp);
    }
    result
}
fn write_json(root: &Path, path: &str, value: &impl Serialize) -> Result<()> {
    write(
        root,
        path,
        &format!("{}\n", serde_json::to_string_pretty(value)?),
    )
}
pub fn config(root: &Path) -> Result<Config> {
    let mut config: Config =
        serde_json::from_str(&read(root, "aing.json").context("run aing init first")?)?;
    if !config.registry.contains("://") && !Path::new(&config.registry).is_absolute() {
        config.registry = root.join(&config.registry).to_string_lossy().into_owned();
    }
    ensure!(
        ["css", "tailwind"].contains(&config.style.as_str()),
        "invalid style"
    );
    ensure!(
        ["npm", "pnpm", "yarn", "bun"].contains(&config.package_manager.as_str()),
        "invalid package manager"
    );
    for path in config.paths.values().chain([&config.entry, &config.css]) {
        safe_path(root, path)?;
    }
    ensure!(
        config.paths.contains_key("ui")
            && config.paths.contains_key("lib")
            && config.aliases.contains_key("ui")
            && config.aliases.contains_key("lib"),
        "missing ui/lib paths or aliases"
    );
    Ok(config)
}
fn detect(root: &Path) -> Result<Config> {
    let package =
        json_file(root, "package.json").context("aing needs a React project with package.json")?;
    let dependencies = format!("{} {}", package["dependencies"], package["devDependencies"]);
    ensure!(dependencies.contains("react"), "React project required");
    let src = root.join("src").is_dir();
    let prefix = if src { "src/" } else { "" };
    let framework = if dependencies.contains("\"next\"") {
        "next"
    } else if dependencies.contains("react-router") {
        "react-router"
    } else if dependencies.contains("vite") {
        "vite"
    } else {
        "react"
    };
    let entries = match framework {
        "next" => vec![
            format!("{prefix}app/layout.tsx"),
            format!("{prefix}app/layout.jsx"),
            format!("{prefix}pages/_app.tsx"),
            format!("{prefix}pages/_app.jsx"),
        ],
        "react-router" => vec!["app/root.tsx".into(), format!("{prefix}main.tsx")],
        _ => vec![
            format!("{prefix}main.tsx"),
            format!("{prefix}main.jsx"),
            format!("{prefix}index.tsx"),
            format!("{prefix}index.jsx"),
        ],
    };
    let entry = entries
        .into_iter()
        .find(|p| exists(root, p))
        .context("cannot find application entry (layout, _app, root, main, or index)")?;
    let declared = package["packageManager"]
        .as_str()
        .and_then(|v| v.split('@').next());
    let manager = declared
        .filter(|v| ["npm", "pnpm", "yarn", "bun"].contains(v))
        .unwrap_or_else(|| {
            if exists(root, "pnpm-lock.yaml") {
                "pnpm"
            } else if exists(root, "yarn.lock") {
                "yarn"
            } else if exists(root, "bun.lock") || exists(root, "bun.lockb") {
                "bun"
            } else {
                "npm"
            }
        });
    let mut result = Config {
        registry: "embedded://aing".into(),
        style: "css".into(),
        framework: framework.into(),
        src,
        tailwind: dependencies.contains("tailwindcss"),
        package_manager: manager.into(),
        aliases: BTreeMap::from([
            ("ui".into(), "@/components/ui".into()),
            ("lib".into(), "@/lib".into()),
        ]),
        paths: BTreeMap::from([
            ("ui".into(), format!("{prefix}components/ui")),
            ("lib".into(), format!("{prefix}lib")),
        ]),
        entry,
        css: format!("{prefix}aing.css"),
    };
    if exists(root, "components.json") {
        let existing = json_file(root, "components.json")?;
        for key in ["ui", "lib"] {
            if let Some(alias) = existing["aliases"][key].as_str() {
                result.aliases.insert(key.into(), alias.into());
                if let Some(path) = alias.strip_prefix("@/") {
                    result.paths.insert(key.into(), format!("{prefix}{path}"));
                }
            }
        }
    }
    Ok(result)
}
fn state(root: &Path) -> Result<Value> {
    if exists(root, ".aing/lock.json") {
        let value = json_file(root, ".aing/lock.json")?;
        ensure!(
            value["items"].is_object() && value["css"].is_object(),
            "invalid .aing/lock.json; expected items and css objects"
        );
        Ok(value)
    } else {
        Ok(json!({"items":{},"css":{}}))
    }
}
fn token_rules() -> Result<Value> {
    let registry = Registry::new("embedded://aing")?;
    let mut css = registry.get("button")?["css"].clone();
    if let Some(rules) = css["@layer aing"].as_object_mut() {
        rules.retain(|key, _| {
            key == ":root"
                || key == ".dark"
                || key.starts_with(".aing-button, .aing-select")
                || key.contains(":focus-visible")
                || key.contains("aria-invalid")
        });
    }
    Ok(css)
}
fn relative(from: &str, to: &str) -> String {
    let from = Path::new(from).parent().unwrap_or(Path::new(""));
    let to = Path::new(to);
    let a: Vec<_> = from.components().collect();
    let b: Vec<_> = to.components().collect();
    let common = a.iter().zip(&b).take_while(|(a, b)| a == b).count();
    let mut parts = vec!["..".to_owned(); a.len() - common];
    parts.extend(
        b[common..]
            .iter()
            .map(|v| v.as_os_str().to_string_lossy().to_string()),
    );
    let result = parts.join("/");
    if result.starts_with('.') {
        result
    } else {
        format!("./{result}")
    }
}
fn entry_with_css(root: &Path, config: &Config) -> Result<String> {
    let source = read(root, &config.entry)?;
    let path = relative(&config.entry, &config.css);
    if transform::imports(&source, &config.entry)?
        .iter()
        .any(|(_, p)| p == &path)
    {
        return Ok(source);
    }
    // Keep the client directive first when the application entry uses one.
    let import = format!("import {};\n", serde_json::to_string(&path)?);
    if source.starts_with("'use client';") || source.starts_with("\"use client\";") {
        let end = source.find(';').unwrap() + 1;
        Ok(format!("{}\n{import}{}", &source[..end], &source[end..]))
    } else {
        Ok(format!("{import}{source}"))
    }
}
fn updated_css(root: &Path, config: &Config, rules: &Value) -> Result<String> {
    let local = read(root, &config.css)?;
    let base = read(root, &format!(".aing/base/{}", config.css)).unwrap_or_else(|_| local.clone());
    let latest = transform::merge_managed_css(&base, rules)?;
    let (merged, conflict) = transform::merge3(&base, &local, &latest);
    ensure!(
        !conflict,
        "CSS token conflict in {}; preserve your changes and resolve the overlapping token before adding or syncing",
        config.css
    );
    Ok(merged)
}
fn install(root: &Path, config: &Config, dependencies: &BTreeSet<String>) -> Result<()> {
    let mut required = Vec::new();
    for dep in dependencies {
        valid_dependency(dep)?;
        let split = dep.rfind('@').filter(|i| *i > 0);
        let name = split.map(|i| &dep[..i]).unwrap_or(dep);
        let installed = root.join("node_modules").join(name).join("package.json");
        if let Ok(text) = fs::read_to_string(installed) {
            let package: Value = serde_json::from_str(&text)?;
            if split.is_none_or(|i| package["version"].as_str() == Some(&dep[i + 1..])) {
                continue;
            }
        }
        let value = if name == "@aing/core" {
            std::env::var("AING_CORE_PACKAGE").unwrap_or_else(|_| dep.clone())
        } else {
            dep.clone()
        };
        ensure!(!value.starts_with('-'), "invalid package override");
        required.push(value);
    }
    if required.is_empty() {
        return Ok(());
    }
    let executable = if cfg!(windows) && config.package_manager != "bun" {
        format!("{}.cmd", config.package_manager)
    } else {
        config.package_manager.clone()
    };
    let mut command = Command::new(&executable);
    command.current_dir(root);
    if config.package_manager == "npm" {
        command.args(["install", "--save"]);
    } else {
        command.arg("add");
    }
    let output = command
        .args(&required)
        .output()
        .with_context(|| format!("run {executable}"))?;
    eprint!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    ensure!(
        output.status.success(),
        "dependency installation failed; no component files were changed ({})",
        output.status
    );
    Ok(())
}
pub fn init(root: &Path, registry: Option<String>, style: Option<String>) -> Result<Value> {
    ensure!(
        !exists(root, "aing.json"),
        "aing.json already exists; edit it to change settings"
    );
    let mut config = detect(root)?;
    if let Some(registry) = registry {
        config.registry = if !registry.contains("://") && !Path::new(&registry).is_absolute() {
            root.join(registry).to_string_lossy().into_owned()
        } else {
            registry
        };
    }
    if let Some(style) = style {
        config.style = style;
    }
    ensure!(
        config.style != "tailwind" || config.tailwind,
        "Tailwind is not installed; use --style css"
    );
    Registry::new(&config.registry)?;
    let css = transform::merge_managed_css(
        &fs::read_to_string(safe_path(root, &config.css)?).unwrap_or_default(),
        &token_rules()?,
    )?;
    let entry = entry_with_css(root, &config)?;
    install(root, &config, &BTreeSet::from(["@aing/core@0.1.0".into()]))?;
    write(root, &config.css, &css)?;
    write(root, &format!(".aing/base/{}", config.css), &css)?;
    write(root, &config.entry, &entry)?;
    write_json(root, "aing.json", &config)?;
    write_json(
        root,
        ".aing/lock.json",
        &json!({"items":{},"css":token_rules()?}),
    )?;
    Ok(json!({"initialized":true,"config":config}))
}
#[derive(Default)]
struct Plan {
    files: BTreeMap<String, String>,
    items: BTreeMap<String, Vec<String>>,
    dependencies: BTreeSet<String>,
    css: Value,
}
fn plan(config: &Config, registry: &Registry, names: &[String], style: &str) -> Result<Plan> {
    let items = registry.resolve(names, style)?;
    let mut plan = Plan {
        css: json!({}),
        ..Default::default()
    };
    let mut mapping = BTreeMap::new();
    for item in &items {
        for file in item["files"].as_array().context("missing files")? {
            let source = file["path"].as_str().context("file missing path")?;
            let kind = file["type"]
                .as_str()
                .or_else(|| item["type"].as_str())
                .unwrap_or("registry:ui");
            let group = if kind == "registry:lib" { "lib" } else { "ui" };
            let name = Path::new(source)
                .file_name()
                .context("invalid filename")?
                .to_string_lossy();
            let target = if let Some(target) = file["target"].as_str() {
                if let Some(target) = target.strip_prefix("lib/") {
                    format!("{}/{target}", config.paths["lib"])
                } else {
                    target.to_owned()
                }
            } else {
                format!("{}/{name}", config.paths[group])
            };
            ensure!(
                !target
                    .split('/')
                    .any(|part| [".git", ".aing", "node_modules"].contains(&part)),
                "registry target uses a protected directory: {target}"
            );
            safe_path(Path::new("."), &target)?;
            mapping.insert(
                source.trim_start_matches("registry/").to_owned(),
                target.clone(),
            );
            mapping.insert(source.to_owned(), target.clone());
            plan.items
                .entry(item["name"].as_str().context("missing name")?.into())
                .or_default()
                .push(target.clone());
        }
    }
    for item in &items {
        for dep in strings(&item["dependencies"]) {
            valid_dependency(&dep)?;
            plan.dependencies.insert(dep);
        }
        let mut rules = item["css"].clone();
        if let Some(nested) = rules
            .get_mut("@layer components")
            .and_then(Value::as_object_mut)
            .and_then(|layer| layer.remove("@layer aing"))
        {
            if rules["@layer aing"].is_null() {
                rules["@layer aing"] = json!({});
            }
            transform::merge_json(&mut rules["@layer aing"], &nested);
            if rules["@layer components"]
                .as_object()
                .is_some_and(|v| v.is_empty())
            {
                rules.as_object_mut().unwrap().remove("@layer components");
            }
        }
        transform::merge_json(&mut plan.css, &rules);
        if let Some(vars) = item["cssVars"].as_object() {
            for (group, values) in vars {
                let selector = match group.as_str() {
                    "light" => ":root",
                    "dark" => ".dark",
                    "theme" => "@theme inline",
                    _ => bail!("unknown cssVars group {group}"),
                };
                ensure!(
                    group != "theme" || config.tailwind,
                    "cssVars.theme requires Tailwind"
                );
                for (name, value) in values
                    .as_object()
                    .context("cssVars values must be objects")?
                {
                    let mut rule = json!({});
                    if group == "theme" {
                        rule[selector][format!("--{}", name.trim_start_matches("--"))] =
                            value.clone();
                    } else {
                        rule["@layer aing"][selector]
                            [format!("--{}", name.trim_start_matches("--"))] = value.clone();
                    }
                    transform::merge_json(&mut plan.css, &rule);
                }
            }
        }
        let files = item["files"].as_array().context("missing files")?;
        for file in files {
            let source = file["path"].as_str().context("missing file path")?;
            let target = &mapping[source];
            let content = file["content"]
                .as_str()
                .context("registry files need inline content")?;
            let content = if ["ts", "tsx", "js", "jsx"]
                .iter()
                .any(|ext| source.ends_with(&format!(".{ext}")))
            {
                transform::rewrite(content, source, |import| {
                    if import.starts_with('.') {
                        let mut source_parts: Vec<&str> = source.split('/').collect();
                        source_parts.pop();
                        for part in import.split('/') {
                            match part {
                                "." => {}
                                ".." => {
                                    source_parts.pop();
                                }
                                other => source_parts.push(other),
                            }
                        }
                        let source_key = source_parts.join("/");
                        if let Some((_, dest)) = mapping.iter().find(|(key, _)| {
                            key.trim_end_matches(".tsx").trim_end_matches(".ts")
                                == source_key.trim_end_matches(".tsx").trim_end_matches(".ts")
                        }) {
                            return Some(
                                relative(target, dest)
                                    .trim_end_matches(".tsx")
                                    .trim_end_matches(".ts")
                                    .to_owned(),
                            );
                        }
                    }
                    let key = import.trim_start_matches("@/");
                    if let Some(target_import) = mapping.get(key).or_else(|| {
                        mapping
                            .iter()
                            .find(|(source, _)| {
                                source.trim_end_matches(".tsx").trim_end_matches(".ts") == key
                            })
                            .map(|(_, t)| t)
                    }) {
                        return Some(
                            relative(target, target_import)
                                .trim_end_matches(".tsx")
                                .trim_end_matches(".ts")
                                .to_owned(),
                        );
                    }
                    for group in ["ui", "lib"] {
                        if let Some(suffix) = import
                            .strip_prefix(&format!("@/registry/aing/{group}/"))
                            .or_else(|| import.strip_prefix(&format!("@/{group}/")))
                        {
                            return Some(relative(
                                target,
                                &format!("{}/{suffix}", config.paths[group]),
                            ));
                        }
                        if let Some(suffix) =
                            import.strip_prefix(&format!("{}/", config.aliases[group]))
                        {
                            return Some(relative(
                                target,
                                &format!("{}/{suffix}", config.paths[group]),
                            ));
                        }
                    }
                    None
                })?
            } else {
                content.to_owned()
            };
            if let Some(existing) = plan.files.insert(target.clone(), content.clone()) {
                ensure!(
                    existing == content,
                    "conflicting registry files at {target}"
                );
            }
        }
    }
    Ok(plan)
}
pub fn add(
    root: &Path,
    names: &[String],
    style: Option<&str>,
    dry_run: bool,
    overwrite: bool,
) -> Result<Value> {
    let config = config(root)?;
    let style = style.unwrap_or(&config.style);
    ensure!(
        style != "tailwind" || config.tailwind,
        "Tailwind is not installed; use --style css"
    );
    let registry = Registry::new(&config.registry)?;
    let plan = plan(&config, &registry, names, style)?;
    let mut state = state(root)?;
    for (path, content) in &plan.files {
        let file = safe_path(root, path)?;
        ensure!(
            overwrite || !file.exists() || fs::read_to_string(file)? == *content,
            "{path} exists; use aing sync to preserve edits or --overwrite"
        );
        safe_path(root, &format!(".aing/base/{path}"))?;
    }
    transform::merge_json(&mut state["css"], &plan.css);
    let css = updated_css(root, &config, &state["css"])?;
    let result = json!({"dry_run":dry_run,"files":plan.files.keys().collect::<Vec<_>>(),"dependencies":plan.dependencies,"style":style});
    if dry_run {
        return Ok(result);
    }
    install(root, &config, &plan.dependencies)?;
    for (path, content) in &plan.files {
        write(root, path, content)?;
        write(root, &format!(".aing/base/{path}"), content)?;
    }
    state["items"]
        .as_object_mut()
        .context("invalid lock")?
        .retain(|name, _| {
            !plan.items.keys().any(|new| {
                new != name
                    && new.trim_end_matches("-tailwind") == name.trim_end_matches("-tailwind")
            })
        });
    for (name, files) in &plan.items {
        state["items"][name] = json!({"files":files,"dependencies":plan.dependencies});
    }
    write(root, &config.css, &css)?;
    let css_base = read(root, &format!(".aing/base/{}", config.css)).unwrap_or_default();
    write(
        root,
        &format!(".aing/base/{}", config.css),
        &transform::merge_managed_css(&css_base, &state["css"])?,
    )?;
    write_json(root, ".aing/lock.json", &state)?;
    Ok(result)
}
pub fn diff(root: &Path, name: &str) -> Result<Value> {
    let config = config(root)?;
    let registry = Registry::new(&config.registry)?;
    let state = state(root)?;
    let canonical = registry.get(name)?["name"]
        .as_str()
        .context("missing name")?
        .to_owned();
    let installed = state["items"]
        .as_object()
        .context("invalid lock")?
        .keys()
        .find(|key| key.trim_end_matches("-tailwind") == canonical.trim_end_matches("-tailwind"))
        .cloned()
        .unwrap_or(canonical);
    let plan = plan(&config, &registry, &[installed], "css")?;
    let mut output = BTreeMap::new();
    for (path, latest) in &plan.files {
        let local = read(root, path).unwrap_or_default();
        output.insert(
            path,
            if local == *latest {
                String::new()
            } else {
                diffy::create_patch(&local, latest).to_string()
            },
        );
    }
    Ok(json!(output))
}
pub fn sync(root: &Path) -> Result<Value> {
    let config = config(root)?;
    let registry = Registry::new(&config.registry)?;
    let mut state = state(root)?;
    let names: Vec<String> = state["items"]
        .as_object()
        .context("invalid lock")?
        .keys()
        .cloned()
        .collect();
    let plan = plan(&config, &registry, &names, "css")?;
    let mut updates = BTreeMap::new();
    let mut conflicts = Vec::new();
    for (path, latest) in &plan.files {
        let base_path = format!(".aing/base/{path}");
        if !safe_path(root, &base_path)?.exists() {
            ensure!(
                !safe_path(root, path)?.exists(),
                "new upstream file would overwrite your file: {path}"
            );
            updates.insert(path.clone(), latest.clone());
            continue;
        }
        let local = read(root, path)
            .with_context(|| format!("installed file missing: {path}; restore it before sync"))?;
        let base = read(root, &base_path)?;
        ensure!(
            !local.contains("<<<<<<< ours") && !local.contains("<<<<<<< original"),
            "resolve existing conflicts before syncing {path}"
        );
        let (merged, conflict) = transform::merge3(&base, &local, latest);
        if conflict {
            conflicts.push(path.clone());
        }
        updates.insert(path.clone(), merged);
    }
    transform::merge_json(&mut state["css"], &plan.css);
    let css = updated_css(root, &config, &state["css"])?;
    install(root, &config, &plan.dependencies)?;
    for (path, merged) in &updates {
        write(root, path, merged)?;
        // Advancing the base lets a manually resolved local choice survive the next sync.
        write(root, &format!(".aing/base/{path}"), &plan.files[path])?;
    }
    let old_paths: BTreeSet<String> = state["items"]
        .as_object()
        .context("invalid lock")?
        .values()
        .flat_map(|item| strings(&item["files"]))
        .collect();
    let retained: Vec<_> = old_paths
        .into_iter()
        .filter(|p| !plan.files.contains_key(p))
        .collect();
    for (name, files) in &plan.items {
        let mut tracked: BTreeSet<String> = strings(&state["items"][name]["files"])
            .into_iter()
            .collect();
        tracked.extend(files.iter().cloned());
        state["items"][name] = json!({"files":tracked,"dependencies":plan.dependencies});
    }
    write(root, &config.css, &css)?;
    let css_base = read(root, &format!(".aing/base/{}", config.css)).unwrap_or_default();
    write(
        root,
        &format!(".aing/base/{}", config.css),
        &transform::merge_managed_css(&css_base, &state["css"])?,
    )?;
    write_json(root, ".aing/lock.json", &state)?;
    Ok(
        json!({"updated":updates.keys().collect::<Vec<_>>(),"conflicts":conflicts,"retained_removed_files":retained}),
    )
}
pub fn check(root: &Path) -> Result<Value> {
    let config = config(root)?;
    let state = state(root)?;
    let css = read(root, &config.css)?;
    ensure!(
        transform::imports(&read(root, &config.entry)?, &config.entry)?
            .iter()
            .any(|(_, s)| s == &relative(&config.entry, &config.css)),
        "application entry does not import aing.css"
    );
    let core = json_file(root, "node_modules/@aing/core/package.json")
        .context("@aing/core is not installed")?;
    ensure!(
        core["version"] == "0.1.0",
        "expected @aing/core 0.1.0, found {}",
        core["version"]
    );
    let mut checked = BTreeSet::new();
    for item in state["items"].as_object().context("invalid lock")?.values() {
        for path in strings(&item["files"]) {
            let source = read(root, &path)?;
            ensure!(
                !source.contains("<<<<<<<"),
                "unresolved merge conflict: {path}"
            );
            if !["ts", "tsx", "js", "jsx"]
                .iter()
                .any(|ext| path.ends_with(&format!(".{ext}")))
            {
                checked.insert(path);
                continue;
            }
            for (_, import) in transform::imports(&source, &path)? {
                ensure!(
                    !import.contains("@/registry/"),
                    "unmapped registry import {import} in {path}"
                );
                if !import.starts_with('.') && !import.starts_with("node:") {
                    let parts: Vec<_> = import.split('/').collect();
                    let package = if import.starts_with('@') {
                        parts.iter().take(2).copied().collect::<Vec<_>>().join("/")
                    } else {
                        parts[0].to_owned()
                    };
                    ensure!(
                        root.join("node_modules")
                            .join(&package)
                            .join("package.json")
                            .is_file(),
                        "missing dependency {package} (import {import} in {path})"
                    );
                }
                if import.starts_with('.') {
                    let candidate = root.join(Path::new(&path).parent().unwrap()).join(&import);
                    ensure!(
                        candidate.is_file()
                            || ["ts", "tsx", "js", "jsx", "css"]
                                .iter()
                                .any(|ext| candidate.with_extension(ext).is_file())
                            || candidate.join("index.ts").is_file()
                            || candidate.join("index.tsx").is_file(),
                        "missing import {import} in {path}"
                    );
                }
            }
            for segment in source.split("var(--").skip(1) {
                let name = segment.split([')', ',', ' ']).next().unwrap_or("");
                ensure!(
                    css.contains(&format!("--{name}:")),
                    "missing CSS token --{name}"
                );
            }
            checked.insert(path);
        }
    }
    ensure!(
        css.contains("--background:") && css.contains("--primary:"),
        "missing aing CSS tokens"
    );
    Ok(json!({"passed":true,"files":checked,"core":core["version"]}))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn refuses_path_traversal() {
        let root = tempfile::tempdir().unwrap();
        for path in ["../evil", "/evil", "a/../evil", "C:/evil", "a\\evil"] {
            assert!(safe_path(root.path(), path).is_err());
        }
    }
    #[cfg(unix)]
    #[test]
    fn refuses_symlink_escape() {
        let root = tempfile::tempdir().unwrap();
        let other = tempfile::tempdir().unwrap();
        std::os::unix::fs::symlink(other.path(), root.path().join("components")).unwrap();
        assert!(safe_path(root.path(), "components/ui/x.tsx").is_err());
    }
    #[test]
    fn relative_import_without_alias_configuration() {
        assert_eq!(
            relative("src/components/ui/x.tsx", "src/lib/utils.ts"),
            "../../lib/utils.ts"
        );
        assert_eq!(relative("src/main.tsx", "src/aing.css"), "./aing.css");
    }
}
