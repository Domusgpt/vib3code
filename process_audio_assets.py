import json
import os
import sys
import shutil

def process_assets(staging_batch_dir_name, base_filename, asset_fields_json_str):
    # 1. Construct Paths
    metadata_file_path = f"/app/content_pipeline/staging/{staging_batch_dir_name}/{base_filename}_metadata.json"
    incoming_batch_base_path = f"/app/content_pipeline/incoming/{staging_batch_dir_name}"
    processed_assets_article_audio_path = f"/app/content_pipeline/processed_assets/audio/{base_filename}" # Changed 'images' to 'audio'

    # 2. Initialization
    processed_audio_log = [] # Renamed from processed_images_log
    error_log = []
    ai_message = ""
    updated_metadata_file_path = None

    try:
        asset_fields = json.loads(asset_fields_json_str)
    except json.JSONDecodeError as e:
        error_log.append(f"Error parsing asset_fields_json: {e}")
        # Output results and exit if essential parameters are bad
        print(json.dumps({
            "processed_audio_log": processed_audio_log, # Renamed
            "error_log": error_log,
            "editorial_ai_message": "Error: Could not parse asset fields JSON.",
            "updated_metadata_file_path": None
        }))
        return

    os.makedirs(processed_assets_article_audio_path, exist_ok=True) # Changed variable name

    # DEBUG: Check if directory was created
    if not os.path.isdir(processed_assets_article_audio_path):
        error_log.append(f"CRITICAL: Directory {processed_assets_article_audio_path} was NOT created by os.makedirs, or is not a directory.")
    else:
        # This log can be removed later, it's for immediate debugging.
        error_log.append(f"DEBUG: Directory {processed_assets_article_audio_path} successfully created or already exists.")


    # 3. Read Article Metadata
    try:
        with open(metadata_file_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except FileNotFoundError:
        error_log.append(f"Metadata file not found: {metadata_file_path}")
        ai_message = f"Error processing assets for '{base_filename}': Metadata file not found."
        print(json.dumps({
            "processed_audio_log": processed_audio_log, # Renamed
            "error_log": error_log,
            "editorial_ai_message": ai_message,
            "updated_metadata_file_path": updated_metadata_file_path
        }))
        return
    except json.JSONDecodeError as e:
        error_log.append(f"Error decoding metadata JSON from {metadata_file_path}: {e}")
        ai_message = f"Error processing assets for '{base_filename}': Could not decode metadata."
        print(json.dumps({
            "processed_audio_log": processed_audio_log, # Renamed
            "error_log": error_log,
            "editorial_ai_message": ai_message,
            "updated_metadata_file_path": updated_metadata_file_path
        }))
        return

    # 4. Process Asset Fields
    metadata_updated = False
    successful_copies = 0
    failed_copies = 0

    for field_name in asset_fields:
        if field_name in metadata and metadata[field_name]:
            field_value = metadata[field_name]
            image_paths_to_process = []
            is_list_field = False
            new_paths_for_list_field = []

            if isinstance(field_value, str):
                image_paths_to_process = [field_value]
            elif isinstance(field_value, list):
                image_paths_to_process = field_value
                is_list_field = True
            else:
                # error_log.append(f"Asset field '{field_name}' in metadata is not a string or list: {type(field_value)}. Skipping.")
                continue # Skip if not string or list

            field_actually_updated_this_iteration = False
            for relative_path in image_paths_to_process:
                if not isinstance(relative_path, str) or not relative_path.strip(): # Skip empty or non-string paths
                    if is_list_field:
                        new_paths_for_list_field.append(relative_path)
                    continue

                # Check if path looks like it's already processed
                if relative_path.startswith('/content_pipeline/processed_assets/'):
                    if is_list_field:
                        new_paths_for_list_field.append(relative_path) # Keep already processed path
                    # For single string field, metadata[field_name] is already correct, so do nothing.
                    continue

                # Normalize relative_path: remove leading slashes if any, to correctly join with base_path
                # This is primarily for paths like "audio/file.mp3" vs "/audio/file.mp3" from metadata
                clean_relative_path = relative_path.lstrip('/')
                source_audio_path = os.path.normpath(os.path.join(incoming_batch_base_path, clean_relative_path)) # Renamed source_image_path
                audio_filename = os.path.basename(clean_relative_path) # Renamed image_filename
                destination_audio_path = os.path.join(processed_assets_article_audio_path, audio_filename) # Renamed destination_image_path and used audio path
                new_metadata_path = f"/content_pipeline/processed_assets/audio/{base_filename}/{audio_filename}" # Changed 'images' to 'audio'

                try:
                    if not os.path.exists(source_audio_path):
                        raise FileNotFoundError(f"Source audio file not found: {source_audio_path}") # Changed message

                    shutil.copy2(source_audio_path, destination_audio_path) # Use audio paths
                    processed_audio_log.append({"source": source_audio_path, "staged_at": new_metadata_path, "status": "success"}) # Use audio log
                    successful_copies += 1
                    if is_list_field:
                        new_paths_for_list_field.append(new_metadata_path)
                    else:
                        metadata[field_name] = new_metadata_path
                    metadata_updated = True
                    field_actually_updated_this_iteration = True
                except Exception as e:
                    error_log.append(f"Error copying '{source_audio_path}' to '{destination_audio_path}': {e}") # Use audio paths
                    processed_audio_log.append({"source": source_audio_path, "original_path_in_metadata": relative_path, "status": "error", "error": str(e)}) # Use audio log
                    failed_copies +=1
                    if is_list_field: # If copy failed, keep the original path in the list for this field
                        new_paths_for_list_field.append(relative_path)


            if is_list_field and field_actually_updated_this_iteration : # only update if any path in list was successfully processed
                metadata[field_name] = new_paths_for_list_field
            elif is_list_field and not field_actually_updated_this_iteration and image_paths_to_process:
                # If it was a list, and no items were updated (e.g. all failed or were invalid)
                # ensure the original list (or its valid parts) is retained if nothing changed.
                # This case should be covered by new_paths_for_list_field accumulating original paths on error.
                pass


    # 5. Save Updated Metadata (if changed)
    if metadata_updated:
        try:
            # Custom handler for JSON serialization of date/datetime objects, if any (copied from previous script)
            def json_serial(obj):
                from datetime import date, datetime
                if isinstance(obj, (datetime, date)):
                    return obj.isoformat()
                raise TypeError(f"Type {type(obj)} not serializable")
            with open(metadata_file_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=4, default=json_serial)
            updated_metadata_file_path = metadata_file_path
        except Exception as e:
            error_log.append(f"Error writing updated metadata to {metadata_file_path}: {e}")

    # 6. Prepare EditorialAI Message
    article_title = metadata.get('title', base_filename)
    if successful_copies > 0 and failed_copies == 0:
        ai_message = f"Successfully processed all {successful_copies} audio asset(s) for article '{article_title}'." # Changed 'image' to 'audio'
    elif successful_copies > 0 and failed_copies > 0:
        ai_message = f"Processed audio assets for article '{article_title}': {successful_copies} succeeded, {failed_copies} failed. Check logs." # Changed 'image' to 'audio'
    elif successful_copies == 0 and failed_copies > 0:
        ai_message = f"Failed to process {failed_copies} audio asset(s) for article '{article_title}'. Check logs." # Changed 'image' to 'audio'
    elif successful_copies == 0 and failed_copies == 0 and not processed_audio_log: # No assets found or processed / Renamed
        ai_message = f"No audio assets found or processed based on metadata fields for article '{article_title}'." # Changed 'image' to 'audio'
    else: # Should not happen, but default
        ai_message = f"Audio asset processing for article '{article_title}' completed. Processed: {len(processed_audio_log)}. Check logs for details." # Changed 'image' to 'audio', Renamed


    # 7. Return Results (printed as JSON to stdout)
    print(json.dumps({
        "processed_audio_log": processed_audio_log, # Renamed
        "error_log": error_log,
        "editorial_ai_message": ai_message,
        "updated_metadata_file_path": updated_metadata_file_path,
        "metadata_after_processing": metadata # For debugging/verification
    }))

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({
            "processed_audio_log": [], # Renamed
            "error_log": ["Usage: python process_audio_assets.py <staging_batch_dir_name> <base_filename> <asset_fields_json_string>"], # Script name updated
            "editorial_ai_message": "Error: Incorrect arguments for process_audio_assets.py.", # Script name updated
            "updated_metadata_file_path": None
        }))
        sys.exit(1)

    staging_batch_dir_name_arg = sys.argv[1]
    base_filename_arg = sys.argv[2]
    asset_fields_json_str_arg = sys.argv[3]

    process_assets(staging_batch_dir_name_arg, base_filename_arg, asset_fields_json_str_arg)
