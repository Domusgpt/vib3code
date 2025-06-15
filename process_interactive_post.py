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

    if frontmatter_delimiters < 2:
        return None, file_content

    return '\n'.join(frontmatter_str), '\n'.join(content_lines)

def process_interactive_file(input_file_path_str, output_dir_path_str):
    input_file_path = Path(input_file_path_str)
    output_dir_path = Path(output_dir_path_str)

    errors = []
    processed_metadata = {}
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
            if markdown_content:
                 processed_metadata['description_markdown_body'] = markdown_content
        else:
            try:
                loaded_frontmatter = yaml.safe_load(frontmatter_data_str)
                if not isinstance(loaded_frontmatter, dict):
                    loaded_frontmatter = {}
                processed_metadata.update(loaded_frontmatter)

                if markdown_content:
                    processed_metadata['description_markdown_body'] = markdown_content
            except yaml.YAMLError as e:
                errors.append(f"Error parsing YAML frontmatter: {e}")
                processed_metadata['content_error'] = "YAML parsing failed."
                if markdown_content:
                    processed_metadata['description_markdown_body'] = markdown_content

        if 'id' in processed_metadata and isinstance(processed_metadata['id'], str) and processed_metadata['id'].strip():
            article_id = processed_metadata['id']
        else:
            processed_metadata['id'] = article_id

        if processed_metadata.get('contentType') != 'interactive':
            errors.append(f"contentType is not 'interactive' or is missing. Found: {processed_metadata.get('contentType')}")
            return {"status": "failure", "output_file": None, "article_id": article_id, "errors": errors, "processed_metadata_summary": processed_metadata}

        if not processed_metadata.get('title'):
            errors.append("Mandatory field 'title' is missing.")

        if not processed_metadata.get('live_url') and not processed_metadata.get('bootstrap_script_path'):
            errors.append("Either 'live_url' or 'bootstrap_script_path' must be provided for an interactive post.")

        # Asset path processing
        single_asset_fields = ['thumbnail_image_path', 'instructions_path', 'bootstrap_script_path', 'header_image_path']
        for asset_field in single_asset_fields:
            if asset_field in processed_metadata and processed_metadata[asset_field]:
                original_path = processed_metadata[asset_field]
                processed_metadata[f'{asset_field}_original'] = original_path
                # Assume bootstrap_script might be a special case, could be a URL or local path
                if asset_field == 'bootstrap_script_path' and (original_path.startswith('http://') or original_path.startswith('https://')):
                     processed_metadata[asset_field] = original_path # Keep as is if URL
                else:
                    final_asset_path = f"/assets/interactive/{article_id}/{Path(original_path).name}"
                    processed_metadata[asset_field] = final_asset_path
            elif asset_field in ['thumbnail_image_path', 'instructions_path', 'bootstrap_script_path', 'header_image_path']: # Ensure optional fields exist if defined in docs
                 processed_metadata[asset_field] = None


        if 'required_assets_paths' in processed_metadata and isinstance(processed_metadata['required_assets_paths'], list):
            processed_required_assets = []
            original_required_assets = []
            for req_asset_path_item in processed_metadata['required_assets_paths']:
                # Item could be a string path, or a dict {path: 'path', type: 'js/css/img'}
                original_item_path = ''
                if isinstance(req_asset_path_item, str):
                    original_item_path = req_asset_path_item
                elif isinstance(req_asset_path_item, dict) and 'path' in req_asset_path_item:
                    original_item_path = req_asset_path_item['path']
                else:
                    errors.append(f"Invalid item in required_assets_paths: {req_asset_path_item}")
                    continue

                original_required_assets.append(req_asset_path_item) # store original structure

                if original_item_path.startswith('http://') or original_item_path.startswith('https://'):
                    # Keep external URLs as is
                    if isinstance(req_asset_path_item, str):
                        processed_required_assets.append(original_item_path)
                    elif isinstance(req_asset_path_item, dict):
                        # If it's a dict, ensure the path is the original URL
                        new_item = req_asset_path_item.copy()
                        new_item['path'] = original_item_path
                        processed_required_assets.append(new_item)
                else:
                    # Process local paths
                    final_req_asset_path = f"/assets/interactive/{article_id}/required/{Path(original_item_path).name}"
                    if isinstance(req_asset_path_item, str):
                        processed_required_assets.append(final_req_asset_path)
                    elif isinstance(req_asset_path_item, dict):
                        new_item = req_asset_path_item.copy()
                        new_item['path'] = final_req_asset_path
                        processed_required_assets.append(new_item)

            processed_metadata['required_assets_paths_original'] = original_required_assets
            processed_metadata['required_assets_paths'] = processed_required_assets
        elif 'required_assets_paths' not in processed_metadata: # Ensure field exists if in docs
            processed_metadata['required_assets_paths'] = []


        current_status = "success"
        # Determine final status based on errors
        if not processed_metadata.get('title') or \
           (not processed_metadata.get('live_url') and not processed_metadata.get('bootstrap_script_path')):
            errors.append("Critical fields (title or live_url/bootstrap_script_path) are missing, setting status to failure.")
            current_status = "failure"
        elif errors: # If other non-critical errors exist
             current_status = "success_with_warnings"

        output_file_path_str = None
        # Only write if contentType was correct and critical fields were present.
        if processed_metadata.get('contentType') == 'interactive' and current_status != "failure":
            output_dir_path.mkdir(parents=True, exist_ok=True)
            output_file_path = output_dir_path / f"{article_id}_metadata.json"
            with open(output_file_path, 'w', encoding='utf-8') as f:
                json.dump(processed_metadata, f, indent=4)
            output_file_path_str = str(output_file_path)
            if errors and current_status == "success": # This case should be covered by success_with_warnings
                 current_status = "success_with_warnings"

        return {
            "status": current_status,
            "output_file": output_file_path_str,
            "article_id": article_id,
            "errors": errors,
            "processed_metadata_summary": {k: v for k, v in processed_metadata.items() if k not in ['description_markdown_body']}
        }

    except Exception as e:
        errors.append(f"An unexpected error occurred in process_interactive_file: {str(e)}")
        summary = {k: v for k, v in processed_metadata.items() if k not in ['description_markdown_body']} if processed_metadata else {}
        return {"status": "failure", "output_file": None, "article_id": article_id, "errors": errors, "processed_metadata_summary": summary}

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(json.dumps({
            "status": "failure",
            "output_file": None,
            "article_id": "unknown",
            "errors": ["Usage: python process_interactive_post.py <input_file_path> <output_dir_path>"],
            "processed_metadata_summary": {}
        }))
        sys.exit(1)

    input_path_arg = sys.argv[1]
    output_dir_arg = sys.argv[2]

    result = process_interactive_file(input_path_arg, output_dir_arg)

    ai_msg = ""
    if result["status"] == "success":
        ai_msg = f"Successfully processed interactive post '{result['article_id']}'. Metadata saved to {result.get('output_file', 'N/A')}."
    elif result["status"] == "success_with_warnings":
        ai_msg = f"Processed interactive post '{result['article_id']}' with warnings. Metadata saved to {result.get('output_file', 'N/A')}."
        if result["errors"]:
             ai_msg += f" Warnings: {'; '.join(map(str, result['errors']))}"
    else: # failure
        ai_msg = f"Failed to process interactive post '{result['article_id']}'."
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
