import json
import yaml
import os
import sys
from pathlib import Path
import re

def extract_frontmatter_and_content(file_content):
    frontmatter_str = []
    content_lines = []
    in_frontmatter = False
    frontmatter_delimiters = 0

    for line in file_content.splitlines():
        if line.strip() == '---':
            frontmatter_delimiters += 1
            if frontmatter_delimiters == 1:
                in_frontmatter = True
                continue
            elif frontmatter_delimiters == 2:
                in_frontmatter = False
                continue

        if in_frontmatter:
            frontmatter_str.append(line)
        elif frontmatter_delimiters >= 2:
            content_lines.append(line)

    if frontmatter_delimiters < 2: # No valid frontmatter found
        return None, file_content # Assume all is content

    return '\n'.join(frontmatter_str), '\n'.join(content_lines)

def process_audio_file(input_file_path_str, output_dir_path_str):
    input_file_path = Path(input_file_path_str)
    output_dir_path = Path(output_dir_path_str)

    errors = []
    processed_metadata = {}
    # Basic ID generation, prefer 'id' from frontmatter if available
    article_id = input_file_path.stem.replace(' ', '_').lower()

    try:
        if not input_file_path.exists():
            errors.append(f"Input file not found: {input_file_path_str}")
            return {"status": "failure", "output_file": None, "article_id": article_id, "errors": errors, "processed_metadata_summary": {}}

        with open(input_file_path, 'r', encoding='utf-8') as f:
            file_content = f.read()

        frontmatter_data_str, markdown_content = extract_frontmatter_and_content(file_content)

        if frontmatter_data_str is None:
            errors.append("No YAML frontmatter detected or frontmatter is malformed.")
            processed_metadata['content_error'] = "No YAML frontmatter."
            processed_metadata['description_markdown_body'] = markdown_content
        else:
            try:
                loaded_frontmatter = yaml.safe_load(frontmatter_data_str)
                if not isinstance(loaded_frontmatter, dict): # Handle empty frontmatter
                    loaded_frontmatter = {}
                processed_metadata.update(loaded_frontmatter) # Merge loaded FM into processed_metadata

                if markdown_content:
                    processed_metadata['description_markdown_body'] = markdown_content
            except yaml.YAMLError as e:
                errors.append(f"Error parsing YAML frontmatter: {e}")
                processed_metadata['content_error'] = "YAML parsing failed."
                if markdown_content: # Still try to save markdown content
                    processed_metadata['description_markdown_body'] = markdown_content

        # Use 'id' from frontmatter if present and valid, otherwise use generated article_id
        if 'id' in processed_metadata and isinstance(processed_metadata['id'], str) and processed_metadata['id'].strip():
            article_id = processed_metadata['id']
        else:
            processed_metadata['id'] = article_id # Ensure ID is in metadata

        # Validate contentType
        if processed_metadata.get('contentType') != 'audio':
            errors.append(f"contentType is not 'audio' or is missing. Found: {processed_metadata.get('contentType')}")
            # This is a critical error for this processor.
            # Include current metadata in summary for debugging
            return {"status": "failure", "output_file": None, "article_id": article_id, "errors": errors, "processed_metadata_summary": processed_metadata}

        # Ensure basic fields for audio
        if not processed_metadata.get('title'):
            errors.append("Mandatory field 'title' is missing.")

        if not processed_metadata.get('audio_url'): # In docs, this was audio_file_path. Assuming audio_url for consistency with video.
                                                # If it should be audio_file_path, this check and related asset processing needs adjustment.
            errors.append("Mandatory field 'audio_url' is missing for audio post.") # Or audio_file_path

        # Placeholder for asset path processing (e.g., episode_artwork_path, shownotes_path)
        # Also, if audio_url is actually audio_file_path, it should be processed here.
        asset_fields_to_process = ['episode_artwork_path', 'shownotes_path', 'header_image_path', 'audio_file_path']
        # If 'audio_url' is meant to be a remote URL, it's not an asset to process.
        # If 'audio_file_path' is the source, then it needs processing. The JULES_WORKFLOW_GUIDE.md used 'audio_file_path'.
        # Let's assume 'audio_file_path' is the primary local asset and 'audio_url' could be an alternative for remote.
        # The current script has 'audio_url' as mandatory, which implies remote. If local, 'audio_file_path' should be mandatory.
        # For now, sticking to 'audio_url' as mandatory (implying remote) and 'audio_file_path' as an optional local asset.

        if 'audio_file_path' in processed_metadata and processed_metadata['audio_file_path']:
             original_path = processed_metadata['audio_file_path']
             processed_metadata[f'audio_file_path_original'] = original_path
             processed_metadata['audio_file_path'] = f"/assets/audio/{article_id}/{Path(original_path).name}"


        for asset_field in ['episode_artwork_path', 'shownotes_path', 'header_image_path']:
            if asset_field in processed_metadata and processed_metadata[asset_field]:
                original_path = processed_metadata[asset_field]
                processed_metadata[f'{asset_field}_original'] = original_path
                final_asset_path = f"/assets/audio/{article_id}/{Path(original_path).name}" # audio subfolder for audio-related assets
                processed_metadata[asset_field] = final_asset_path
            else:
                if asset_field in ['episode_artwork_path', 'shownotes_path', 'header_image_path']:
                     processed_metadata[asset_field] = None


        current_status = "success"
        # Determine final status based on errors
        # Critical errors for 'audio' type: missing title or audio_url (or audio_file_path if that's the primary source)
        if not processed_metadata.get('title') or not processed_metadata.get('audio_url'):
            errors.append("Critical fields (title or audio_url) are missing, setting status to failure.")
            current_status = "failure"
        elif errors: # If other non-critical errors exist
             current_status = "success_with_warnings"


        output_file_path_str = None
        # Only write if contentType was correct and critical fields were present.
        if processed_metadata.get('contentType') == 'audio' and current_status != "failure":
            output_dir_path.mkdir(parents=True, exist_ok=True)
            output_file_path = output_dir_path / f"{article_id}_metadata.json"
            with open(output_file_path, 'w', encoding='utf-8') as f:
                json.dump(processed_metadata, f, indent=4)
            output_file_path_str = str(output_file_path)
            if errors and current_status == "success": # Should have been caught by success_with_warnings
                 current_status = "success_with_warnings"


        return {
            "status": current_status,
            "output_file": output_file_path_str,
            "article_id": article_id,
            "errors": errors,
            "processed_metadata_summary": {k: v for k, v in processed_metadata.items() if k not in ['description_markdown_body']}
        }

    except Exception as e:
        errors.append(f"An unexpected error occurred in process_audio_file: {str(e)}")
        summary = {k: v for k, v in processed_metadata.items() if k not in ['description_markdown_body']} if processed_metadata else {}
        return {"status": "failure", "output_file": None, "article_id": article_id, "errors": errors, "processed_metadata_summary": summary}

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(json.dumps({
            "status": "failure",
            "output_file": None,
            "article_id": "unknown",
            "errors": ["Usage: python process_audio_post.py <input_file_path> <output_dir_path>"],
            "processed_metadata_summary": {}
        }))
        sys.exit(1)

    input_path_arg = sys.argv[1]
    output_dir_arg = sys.argv[2]

    result = process_audio_file(input_path_arg, output_dir_arg)

    ai_msg = ""
    if result["status"] == "success":
        ai_msg = f"Successfully processed audio post '{result['article_id']}'. Metadata saved to {result.get('output_file', 'N/A')}."
    elif result["status"] == "success_with_warnings":
        ai_msg = f"Processed audio post '{result['article_id']}' with warnings. Metadata saved to {result.get('output_file', 'N/A')}."
        if result["errors"]:
             ai_msg += f" Warnings: {'; '.join(map(str, result['errors']))}"
    else: # failure
        ai_msg = f"Failed to process audio post '{result['article_id']}'."
        if result["errors"]:
             ai_msg += f" Errors: {'; '.join(map(str, result['errors']))}"

    final_json_output = {
        "status": result["status"],
        "modified_file": result.get("output_file"),
        "article_id": result["article_id"],
        "changes_summary": ai_msg,
        "editorial_ai_message": ai_msg,
        "errors": [str(e) for e in result["errors"]],
        "processed_metadata_summary": result["processed_metadata_summary"]
    }
    print(json.dumps(final_json_output, indent=4))
