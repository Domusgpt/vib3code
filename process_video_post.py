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

def process_video_file(input_file_path_str, output_dir_path_str):
    input_file_path = Path(input_file_path_str)
    output_dir_path = Path(output_dir_path_str)

    errors = []
    processed_metadata = {}
    article_id = input_file_path.stem.replace(' ', '_').lower() # Basic ID generation

    try:
        if not input_file_path.exists():
            errors.append(f"Input file not found: {input_file_path_str}")
            return {"status": "failure", "output_file": None, "article_id": article_id, "errors": errors, "processed_metadata": {}}

        with open(input_file_path, 'r', encoding='utf-8') as f:
            file_content = f.read()

        frontmatter_data_str, markdown_content = extract_frontmatter_and_content(file_content)

        if frontmatter_data_str is None:
            errors.append("No YAML frontmatter detected or frontmatter is malformed.")
            # Decide if this is a fatal error or if we proceed with defaults/empty metadata
            # For now, let's make it non-fatal but report it.
            processed_metadata['content'] = markdown_content # Store all as content
        else:
            try:
                processed_metadata = yaml.safe_load(frontmatter_data_str)
                if not isinstance(processed_metadata, dict): # Handle empty frontmatter resulting in None
                    processed_metadata = {}
                # If there's markdown content, decide where to put it.
                # For video posts, markdown_content might be a detailed description.
                if markdown_content:
                    processed_metadata['description_markdown_body'] = markdown_content
            except yaml.YAMLError as e:
                errors.append(f"Error parsing YAML frontmatter: {e}")
                # If frontmatter parsing fails, we might still want to save the content
                processed_metadata['content_error'] = "YAML parsing failed."
                processed_metadata['description_markdown_body'] = markdown_content


        # Validate contentType
        if processed_metadata.get('contentType') != 'video':
            errors.append(f"contentType is not 'video' or is missing. Found: {processed_metadata.get('contentType')}")
            # This is a critical error for this processor.
            return {"status": "failure", "output_file": None, "article_id": article_id, "errors": errors, "processed_metadata": processed_metadata}

        # Ensure basic fields
        if not processed_metadata.get('title'):
            errors.append("Mandatory field 'title' is missing.")

        if not processed_metadata.get('video_url') and not processed_metadata.get('embed_code'):
            errors.append("Either 'video_url' or 'embed_code' must be provided for a video post.")

        # Use 'id' from frontmatter if present, otherwise use generated article_id
        if 'id' in processed_metadata:
            article_id = processed_metadata['id']
        else:
            processed_metadata['id'] = article_id

        # Placeholder for asset path processing
        # For now, just ensure the paths are stored if provided.
        # Actual copying and path updates to /assets/... would be handled by a dedicated asset script or finalize_data_and_assets.py
        for asset_field in ['thumbnail_image_path', 'transcript_path', 'header_image_path']: # header_image_path might be unusual for video, but include for consistency
            if asset_field in processed_metadata and processed_metadata[asset_field]:
                original_path = processed_metadata[asset_field]
                # Store a marker that this path needs final processing
                processed_metadata[f'{asset_field}_original'] = original_path
                # Placeholder final path (actual logic will be more complex)
                final_asset_path = f"/assets/videos/{article_id}/{Path(original_path).name}" # Assumes assets go into a common video asset folder structure
                processed_metadata[asset_field] = final_asset_path
            else:
                 processed_metadata[asset_field] = None # Ensure field exists, even if null

        if errors and (not processed_metadata.get('title') or \
                       (not processed_metadata.get('video_url') and not processed_metadata.get('embed_code')) or \
                       "No YAML frontmatter detected" in '; '.join(errors) ):
            # If critical errors like missing title/video source, or no frontmatter at all, mark as failure.
            status = "failure"
        elif errors: # Non-critical errors
             status = "success_with_warnings" # Or just "failure" if any error is major
        else:
            status = "success"

        output_file = None
        # Only write metadata file if core processing was not a complete failure due to missing critical info
        if status in ["success", "success_with_warnings"] or (status == "failure" and "YAML parsing failed." in '; '.join(errors) and processed_metadata.get('title')):
            output_dir_path.mkdir(parents=True, exist_ok=True)
            output_file_path = output_dir_path / f"{article_id}_metadata.json"
            with open(output_file_path, 'w', encoding='utf-8') as f:
                json.dump(processed_metadata, f, indent=4)
            output_file = str(output_file_path)

        return {
            "status": status,
            "output_file": output_file,
            "article_id": article_id,
            "errors": errors,
            "processed_metadata_summary": {k: v for k, v in processed_metadata.items() if k not in ['description_markdown_body']} # Avoid large content in summary
        }

    except Exception as e:
        errors.append(f"An unexpected error occurred: {e}")
        return {"status": "failure", "output_file": None, "article_id": article_id, "errors": errors, "processed_metadata": {}}

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(json.dumps({
            "status": "failure",
            "output_file": None,
            "article_id": "unknown",
            "errors": ["Usage: python process_video_post.py <input_file_path> <output_dir_path>"],
            "processed_metadata_summary": {}
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = sys.argv[2]

    result = process_video_file(input_path, output_dir)

    # Construct editorial_ai_message based on result
    if result["status"] == "success":
        ai_msg = f"Successfully processed video post '{result['article_id']}'. Metadata saved to {result['output_file']}."
    elif result["status"] == "success_with_warnings":
        ai_msg = f"Processed video post '{result['article_id']}' with warnings. Metadata saved to {result['output_file']}."
        if result["errors"]:
            ai_msg += f" Warnings: {'; '.join(result['errors'])}"
    else: # failure
        ai_msg = f"Failed to process video post '{result['article_id']}'."
        if result["errors"]:
            ai_msg += f" Errors: {'; '.join(result['errors'])}"

    final_output = {
        "status": result["status"],
        "modified_file": result["output_file"], # Consistent with other scripts for the 'key' output file
        "article_id": result["article_id"],
        "changes_summary": ai_msg, # Using changes_summary for this message
        "editorial_ai_message": ai_msg, # Also populate this for EditorialAI system
        "errors": result["errors"],
        "processed_metadata_summary": result["processed_metadata_summary"]
    }
    print(json.dumps(final_output, indent=4))
