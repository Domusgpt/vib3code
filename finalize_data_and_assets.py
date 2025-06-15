import json
import os
import sys
import shutil

# Mapping of metadata fields to asset type folders and if they are lists
# This helps in iterating and processing different asset types.
ASSET_FIELD_MAPPING = {
    "header_image_path": {"type": "images", "is_list": False},
    "inline_images": {"type": "images", "is_list": True},
    "gallery_images": {"type": "images", "is_list": True},
    # Assuming thumbnail_image_path and figure_image_path would also be 'images'
    "thumbnail_image_path": {"type": "images", "is_list": False},
    "figure_image_path": {"type": "images", "is_list": False},

    "audio_clip_path": {"type": "audio", "is_list": False},
    "podcast_episode_path": {"type": "audio", "is_list": False},
    "background_tracks": {"type": "audio", "is_list": True},

    "linked_document_pdf": {"type": "documents", "is_list": False},
    # Add other PDF fields if any, e.g., "report_pdf_path"
    "missing_pdf_path": {"type": "documents", "is_list": False} # Example of another PDF field
}
# Note: TXT files with _content fields are not 'moved' assets, so not included here.

def finalize_data(staging_batch_dir_name, base_filename, live_assets_root_dir_on_disk, live_assets_path_prefix_for_router):
    # 1. Paths & Setup
    staging_batch_path = f"/app/content_pipeline/staging/{staging_batch_dir_name}"
    metadata_file_path = os.path.join(staging_batch_path, f"{base_filename}_metadata.json")
    final_metadata_output_path = os.path.join(staging_batch_path, f"{base_filename}_final_for_router.json")
    processed_assets_root = "/app/content_pipeline/processed_assets" # Source for assets

    moved_assets_log = []
    asset_errors = []
    editorial_ai_message = ""

    # 2. Load Staged Metadata
    try:
        with open(metadata_file_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except Exception as e:
        return None, [], [f"Error loading metadata: {e}"], f"Failed to load metadata for {base_filename}."

    # 3. Merge AI Suggestions
    ai_suggestions = metadata.get("ai_suggestions")
    if isinstance(ai_suggestions, dict):
        # Excerpt: prefer suggested if available and original is empty or just a placeholder
        original_excerpt = metadata.get("excerpt", "")
        suggested_excerpt = ai_suggestions.get("suggested_excerpt")
        if suggested_excerpt and (not original_excerpt or len(original_excerpt) < 20):
            metadata["excerpt"] = suggested_excerpt

        # Category: prefer suggested if available. Handle list vs string.
        original_category = metadata.get("category", "")
        suggested_categories = ai_suggestions.get("suggested_categories") # Expected to be a list
        if suggested_categories and isinstance(suggested_categories, list) and len(suggested_categories) > 0:
            metadata["category"] = suggested_categories[0] # Take the first suggested category
        elif suggested_categories and isinstance(suggested_categories, str) : # if only one string category suggested
            metadata["category"] = suggested_categories


        # Tags: merge or replace. For simplicity, let's replace if suggestions exist.
        original_tags = metadata.get("tags", [])
        suggested_tags = ai_suggestions.get("suggested_tags") # Expected to be a list
        if suggested_tags and isinstance(suggested_tags, list):
            metadata["tags"] = list(set(original_tags + suggested_tags)) # Merge and unique, or just assign suggested
            # For this subtask, let's just use suggested if available, else keep original
            metadata["tags"] = suggested_tags if suggested_tags else original_tags

        # Optionally, remove the ai_suggestions key after merging
        # metadata.pop("ai_suggestions", None)
        # For now, keeping it for audit as per subtask notes.

    # 4. Update Asset Paths & Move Assets
    for field_name, field_info in ASSET_FIELD_MAPPING.items():
        if field_name in metadata:
            asset_type_folder = field_info["type"]
            is_list = field_info["is_list"]

            current_paths_val = metadata.get(field_name)

            paths_to_process = []
            if is_list:
                if isinstance(current_paths_val, list):
                    paths_to_process = current_paths_val
            elif isinstance(current_paths_val, str) and current_paths_val.strip(): # Single path string
                paths_to_process = [current_paths_val]

            new_live_paths = []
            for staged_path in paths_to_process:
                if not isinstance(staged_path, str) or not staged_path.strip(): # Handles empty strings in lists
                    new_live_paths.append(staged_path) # Keep empty/invalid entry as is
                    continue

                # Check if path is a processed asset path
                # e.g. /content_pipeline/processed_assets/images/sample_article/header.png
                expected_prefix = f"/content_pipeline/processed_assets/{asset_type_folder}/{base_filename}/"

                if staged_path.startswith(expected_prefix):
                    original_filename = os.path.basename(staged_path)

                    # Construct paths for shutil.copy2 and for the new metadata
                    live_subdir_on_disk = os.path.join(live_assets_root_dir_on_disk, asset_type_folder, base_filename)
                    os.makedirs(live_subdir_on_disk, exist_ok=True)

                    # disk_source_path assumes paths in metadata are absolute from /app
                    # This was how previous scripts (image/audio/doc asset processing) stored them.
                    disk_source_path = staged_path
                    if not disk_source_path.startswith("/app"): # Ensure it's absolute for shutil
                        disk_source_path = "/app" + disk_source_path

                    disk_destination_path = os.path.join(live_subdir_on_disk, original_filename)
                    router_path = f"{live_assets_path_prefix_for_router}/{asset_type_folder}/{base_filename}/{original_filename}"

                    try:
                        if not os.path.exists(disk_source_path):
                             raise FileNotFoundError(f"Source asset for copy not found: {disk_source_path}")
                        shutil.copy2(disk_source_path, disk_destination_path)
                        new_live_paths.append(router_path)
                        moved_assets_log.append({
                            "source_staged_path": staged_path,
                            "live_disk_path": disk_destination_path,
                            "live_router_path": router_path,
                            "status": "moved_to_live"
                        })
                    except Exception as e:
                        new_live_paths.append(staged_path) # Keep original staged path on error
                        asset_errors.append({
                            "field": field_name,
                            "path": staged_path,
                            "error": f"Failed to copy to live location: {e}. Source: {disk_source_path}"
                        })
                else: # Path is not a processed asset path (e.g., already a live path, an external URL, or an error placeholder)
                    new_live_paths.append(staged_path)

            # Update metadata with new paths
            if is_list:
                metadata[field_name] = new_live_paths
            elif new_live_paths: # Single path field, successfully processed
                metadata[field_name] = new_live_paths[0]
            elif paths_to_process and not new_live_paths : # Was a single path, but processing failed to produce a new path
                 # This means the original single path was kept in new_live_paths due to error or not matching prefix
                 # If new_live_paths is empty, it means the original single path was also empty or invalid.
                 # Keep original value if it was a non-empty single path that failed to process.
                 # If current_paths_val was a single string, and new_live_paths is now empty (e.g. original was empty)
                 # or contains the original path (if it failed copy or wasn't a processed_asset path),
                 # this assignment is fine.
                 if current_paths_val and isinstance(current_paths_val, str): # It was a non-empty single string path
                     if not new_live_paths : # Original was empty or processing made it empty
                         metadata[field_name] = current_paths_val
                     else: # new_live_paths[0] contains original or error placeholder
                         metadata[field_name] = new_live_paths[0]
                 # If original was empty or null, and new_live_paths is empty, it's fine.
            # else: if current_paths_val was None or empty string, and is_list is False, it remains as is.


    # 5. Save Finalized Metadata
    try:
        with open(final_metadata_output_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=4)
    except Exception as e:
        errors.append(f"Error writing finalized metadata: {e}")
        return final_metadata_output_path, moved_assets_log, asset_errors, f"Failed to write finalized metadata for {base_filename}."

    message = f"Finalized data and assets for '{base_filename}'. Output: {os.path.basename(final_metadata_output_path)}."
    if asset_errors:
        message += f" Encountered {len(asset_errors)} asset moving errors."

    return final_metadata_output_path, moved_assets_log, asset_errors, message


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(json.dumps({
            "final_metadata_file": None,
            "moved_assets_log": [],
            "asset_errors": ["Incorrect number of arguments provided."],
            "editorial_ai_message": "Error: Incorrect arguments. Usage: python finalize_data_and_assets.py <staging_batch_dir_name> <base_filename> <live_assets_root_dir_on_disk> <live_assets_path_prefix_for_router>"
        }))
        sys.exit(1)

    s_batch_dir = sys.argv[1]
    b_filename = sys.argv[2]
    live_root_disk = sys.argv[3]
    live_prefix_router = sys.argv[4]

    final_meta_path, moved_log, err_list, msg = finalize_data(s_batch_dir, b_filename, live_root_disk, live_prefix_router)

    print(json.dumps({
        "final_metadata_file": final_meta_path,
        "moved_assets_log": moved_log,
        "asset_errors": err_list,
        "editorial_ai_message": msg
    }))
