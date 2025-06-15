import json
import os
import sys
import shutil
from datetime import datetime

# Define known asset field prefixes/suffixes for categorization
# This helps in identifying and categorizing assets from metadata
# This list can be expanded as more asset types/fields are introduced.
KNOWN_ASSET_FIELD_PATTERNS = {
    "image": ["_image_path", "inline_images", "gallery_images"], # field names or suffixes
    "audio": ["_audio_path", "_clip_path", "podcast_episode_path", "background_tracks"],
    "pdf": ["_pdf", "_document_pdf"], # Assuming fields might end with _pdf or _document_pdf
    "txt_embedded": ["_text_path"] # For fields where text content is embedded
}

# Fields that are lists of paths
LIST_ASSET_FIELDS = ["inline_images", "gallery_images", "background_tracks"]


def get_asset_type(field_name):
    for asset_type, patterns in KNOWN_ASSET_FIELD_PATTERNS.items():
        for pattern in patterns:
            if field_name.endswith(pattern) or field_name == pattern:
                return asset_type
    return "unknown" # Default if not matched

def assemble_package(staging_batch_dir_name, base_filename, incoming_batch_dir_name_arg): # Renamed to avoid conflict
    # 1. Paths & Setup
    staging_batch_path = f"/app/content_pipeline/staging/{staging_batch_dir_name}"
    processed_content_dir = os.path.join(staging_batch_path, "01_processed_content")
    source_files_copy_dir = os.path.join(staging_batch_path, "05_source_files_copy")

    os.makedirs(processed_content_dir, exist_ok=True)
    os.makedirs(source_files_copy_dir, exist_ok=True)

    original_html_path = os.path.join(staging_batch_path, f"{base_filename}.html")
    standardized_html_path = os.path.join(processed_content_dir, f"{base_filename}.html")

    files_created_or_verified = []
    errors = []

    # Move HTML to standardized location
    if os.path.exists(original_html_path) and not os.path.exists(standardized_html_path):
        try:
            shutil.move(original_html_path, standardized_html_path)
            files_created_or_verified.append(f"01_processed_content/{base_filename}.html (moved)")
        except Exception as e:
            errors.append(f"Error moving HTML file: {e}")
    elif os.path.exists(standardized_html_path):
        files_created_or_verified.append(f"01_processed_content/{base_filename}.html (verified)")
    else:
        errors.append(f"Processed HTML file not found at {original_html_path} or {standardized_html_path}")

    # 2. Load Data
    metadata_file_path = os.path.join(staging_batch_path, f"{base_filename}_metadata.json")
    theme_suggestions_file_path = os.path.join(staging_batch_path, "theme_suggestions.json")

    metadata = None
    try:
        with open(metadata_file_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        files_created_or_verified.append(f"{base_filename}_metadata.json (verified)")
    except FileNotFoundError:
        errors.append(f"Metadata file not found: {metadata_file_path}")
        # Cannot proceed without metadata for summary/manifest
        return staging_batch_path, files_created_or_verified, f"Failed: Metadata not found for '{base_filename}'.", errors
    except Exception as e:
        errors.append(f"Error loading metadata from {metadata_file_path}: {e}")
        return staging_batch_path, files_created_or_verified, f"Failed: Error loading metadata for '{base_filename}'.", errors

    theme_suggestions = None
    if os.path.exists(theme_suggestions_file_path):
        try:
            with open(theme_suggestions_file_path, 'r', encoding='utf-8') as f:
                theme_suggestions = json.load(f)
            files_created_or_verified.append("theme_suggestions.json (verified)")
        except Exception as e:
            errors.append(f"Error loading theme suggestions from {theme_suggestions_file_path}: {e}")
            # Continue, as theme_suggestions are optional

    # 3. Generate 04_asset_manifest.json
    asset_manifest = []
    for key, value in metadata.items():
        asset_type = get_asset_type(key)
        if asset_type == "unknown" and not key.endswith("_status") and not key.endswith("_content"):
            continue # Skip non-asset fields unless they are status/content fields for known assets

        # Handle single path fields (EXCLUDING txt_embedded which has special handling for its primary field)
        if asset_type != "unknown" and asset_type != "txt_embedded" and isinstance(value, str) and \
           not key.endswith("_content") and not key.endswith("_status"):
            status = "unknown"
            staged_path_or_status_val = value
            if value.startswith("/content_pipeline/processed_assets/"):
                status = "processed"
            elif metadata.get(key + "_status") == "error_reading" or metadata.get(key + "_status") == "error_copying":
                status = "error"
            elif not value: # Empty path string
                 status = "empty_path"

            asset_manifest.append({
                "metadata_field": key,
                "original_relative_path": value if status not in ["processed", "empty_path"] else "N/A (path is processed or empty)",
                "staged_path_or_status": staged_path_or_status_val,
                "status": status,
                "asset_type": asset_type
            })
        # Handle list asset fields
        elif key in LIST_ASSET_FIELDS and isinstance(value, list):
            for item_path in value:
                if not isinstance(item_path, str): continue # Skip non-string items in list
                status = "unknown"
                staged_path_or_status_val = item_path
                if item_path.startswith("/content_pipeline/processed_assets/"):
                    status = "processed"
                elif not item_path: # Empty path string in list
                    status = "empty_path_in_list"
                # Error status for list items is harder to track directly without more complex metadata structure
                # For now, we rely on path structure or emptiness.

                asset_manifest.append({
                    "metadata_field": key,
                    "original_relative_path": item_path if status not in ["processed", "empty_path_in_list"] else "N/A (path is processed or empty)",
                    "staged_path_or_status": staged_path_or_status_val,
                    "status": status,
                    "asset_type": asset_type # asset_type is for the parent field here
                })
        # Handle embedded TXT content
        elif asset_type == "txt_embedded" and key.endswith("_text_path"): # original path field for TXT
            content_field = key + "_content"
            status_field = key + "_status" # e.g., supplementary_text_path_status
            txt_status = metadata.get(status_field, "unknown_status") # Default if status field itself is missing

            staged_info = txt_status # Default staged_info to the status if not processed
            if txt_status == "processed":
                staged_info = f"Embedded in metadata as '{content_field}'"
            elif txt_status == "error_reading":
                staged_info = f"Error reading (see {status_field})"

            asset_manifest.append({
                "metadata_field": key,
                "original_relative_path": value, # Original relative path from the field like supplementary_text_path
                "staged_path_or_status": staged_info,
                "status": txt_status, # This is the crucial status field
                "asset_type": asset_type
            })

    asset_manifest_path = os.path.join(staging_batch_path, "04_asset_manifest.json")
    try:
        with open(asset_manifest_path, 'w', encoding='utf-8') as f:
            json.dump(asset_manifest, f, indent=4)
        files_created_or_verified.append("04_asset_manifest.json (created)")
    except Exception as e:
        errors.append(f"Error writing asset manifest: {e}")

    # 4. Generate 00_PROCESSING_SUMMARY.md
    summary_md_path = os.path.join(staging_batch_path, "00_PROCESSING_SUMMARY.md")
    article_title = metadata.get("title", base_filename)
    summary_content = [
        f"# Processing Summary: {article_title}\n",
        f"- **Batch Name:** {staging_batch_dir_name}",
        f"- **Article Base Filename:** {base_filename}",
        f"- **Processing Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
        "## Primary Content:",
        f"- 1 Markdown file processed into: `01_processed_content/{base_filename}.html`\n",
        "## Asset Processing:",
    ]

    asset_counts = {"total": len(asset_manifest)}
    for item in asset_manifest:
        t = item["asset_type"]
        s = item["status"]
        asset_counts[t] = asset_counts.get(t, 0) + 1
        asset_counts[f"{t}_{s}"] = asset_counts.get(f"{t}_{s}", 0) + 1
        if s == "error":
            asset_counts["total_errors"] = asset_counts.get("total_errors", 0) + 1

    summary_content.append(f"- Total asset entries found/processed: {asset_counts['total']}")
    if asset_counts.get("total_errors"):
        summary_content.append(f"- **Asset Errors Detected:** {asset_counts['total_errors']}")

    for asset_type_name in KNOWN_ASSET_FIELD_PATTERNS.keys():
        if asset_counts.get(asset_type_name):
            type_summary = f"  - {asset_type_name.capitalize()} assets: {asset_counts[asset_type_name]}"
            if asset_counts.get(f"{asset_type_name}_processed"):
                type_summary += f" ({asset_counts[f'{asset_type_name}_processed']} processed/ok)"
            if asset_counts.get(f"{asset_type_name}_error") or asset_counts.get(f"{asset_type_name}_error_reading") or asset_counts.get(f"{asset_type_name}_error_copying"):
                err_count = asset_counts.get(f"{asset_type_name}_error",0) + asset_counts.get(f"{asset_type_name}_error_reading",0) + asset_counts.get(f"{asset_type_name}_error_copying",0)
                type_summary += f" ({err_count} errors)"
            summary_content.append(type_summary)

    summary_content.append("\n## AI Suggestions:")
    if metadata.get("ai_suggestions"):
        summary_content.append("- Metadata suggestions (excerpt, tags, categories) ARE PRESENT in `_metadata.json`.")
    else:
        summary_content.append("- No metadata suggestions (excerpt, tags, categories) found in `_metadata.json`.")

    if theme_suggestions:
        summary_content.append("- Visual theme suggestions ARE PRESENT in `theme_suggestions.json`.")
    else:
        summary_content.append("- No visual theme suggestions found (theme_suggestions.json not present or empty).")

    summary_content.append("\n## General Errors during Assembly:")
    if errors:
        for err in errors:
            summary_content.append(f"- {err}")
    else:
        summary_content.append("- No general errors during package assembly.")

    try:
        with open(summary_md_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(summary_content))
        files_created_or_verified.append("00_PROCESSING_SUMMARY.md (created)")
    except Exception as e:
        errors.append(f"Error writing summary markdown: {e}")

    # 5. (Optional) Copy Source File
    # Assuming source is .md, construct full path
    source_md_filename = f"{base_filename}.md" # Assuming it's always .md
    source_md_path = os.path.join("/app/content_pipeline/incoming", incoming_batch_dir_name_arg, source_md_filename)
    destination_md_path = os.path.join(source_files_copy_dir, source_md_filename)

    if os.path.exists(source_md_path):
        try:
            shutil.copy2(source_md_path, destination_md_path)
            files_created_or_verified.append(f"05_source_files_copy/{source_md_filename} (copied)")
        except Exception as e:
            errors.append(f"Non-critical: Error copying source MD file '{source_md_path}': {e}")
    else:
        errors.append(f"Non-critical: Source MD file not found at '{source_md_path}', not copied.")

    final_editorial_message = f"Assembled Staging Review Package for '{base_filename}'."
    if errors:
         final_editorial_message += " Some issues noted during assembly."

    return staging_batch_path, files_created_or_verified, final_editorial_message, errors

if __name__ == "__main__":
    if len(sys.argv) != 4: # script_name, staging_batch_dir_name, base_filename, incoming_batch_dir_name
        print(json.dumps({
            "staging_package_path": None,
            "files_created_or_verified": [],
            "editorial_ai_message": "Error: Incorrect arguments. Usage: python assemble_review_package.py <staging_batch_dir_name> <base_filename> <incoming_batch_dir_name>",
            "errors": ["Incorrect number of arguments provided."]
        }))
        sys.exit(1)

    s_batch_dir = sys.argv[1]
    b_filename = sys.argv[2]
    i_batch_dir = sys.argv[3] # Corrected argument name

    package_path, files_list, message, err_list = assemble_package(s_batch_dir, b_filename, i_batch_dir)

    print(json.dumps({
        "staging_package_path": package_path,
        "files_created_or_verified": files_list,
        "editorial_ai_message": message,
        "errors": err_list
    }))
