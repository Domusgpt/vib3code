import json
import os
import re
import sys

# Attempt to import dependencies
try:
    import yaml
    PYYAML_AVAILABLE = True
except ImportError:
    PYYAML_AVAILABLE = False

try:
    import markdown
    MARKDOWN_AVAILABLE = True
except ImportError:
    MARKDOWN_AVAILABLE = False

def parse_frontmatter_and_body(content):
    """
    Parses YAML frontmatter and extracts the Markdown body.
    Uses PyYAML if available, otherwise falls back to regex.
    """
    if PYYAML_AVAILABLE:
        try:
            parts = content.split('---', 2)
            if len(parts) >= 3:
                frontmatter_str = parts[1]
                body = parts[2].strip()
                frontmatter = yaml.safe_load(frontmatter_str)
                return frontmatter, body
            else: # No frontmatter detected
                return {}, content.strip() # Return empty frontmatter and full content as body
        except yaml.YAMLError as e:
            # PyYAML parsing failed, try regex as a fallback if content structure suggests frontmatter
            if content.startswith('---'):
                return parse_frontmatter_and_body_regex_fallback(content, "PyYAML failed: " + str(e))
            return {}, content.strip() # No clear frontmatter, treat all as body
        except Exception as e: # Catch any other unexpected error during PyYAML processing
             return parse_frontmatter_and_body_regex_fallback(content, "Unexpected error with PyYAML: " + str(e))

    return parse_frontmatter_and_body_regex_fallback(content, "PyYAML not available.")


def parse_frontmatter_and_body_regex_fallback(content, reason_for_fallback):
    """
    Fallback for parsing frontmatter using regex.
    Also attempts a very basic key-value parsing if regex matches.
    """
    frontmatter = {}
    body = content.strip()
    error = None

    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)', content, re.DOTALL | re.MULTILINE)
    if match:
        frontmatter_str, body_content = match.groups()
        body = body_content.strip()
        # Basic key-value parsing for frontmatter_str
        try:
            for line in frontmatter_str.strip().split('\n'):
                if ':' in line:
                    key, value_str = line.split(':', 1)
                    value = value_str.strip()
                    # If value is quoted, remove quotes
                    if (value.startswith('"') and value.endswith('"')) or \
                       (value.startswith("'") and value.endswith("'")):
                        value = value[1:-1]
                    frontmatter[key.strip()] = value
        except Exception as e:
            error = f"Fallback regex matched, but basic frontmatter parsing failed: {e}. Original fallback reason: {reason_for_fallback}"
            # Keep body if frontmatter parsing fails
    else:
        # No frontmatter detected by regex, treat full content as body
        # This is not an error, but we might want to log the reason for fallback if it was due to PyYAML error
        if "PyYAML failed" in reason_for_fallback or "Unexpected error with PyYAML" in reason_for_fallback:
             error = f"No frontmatter by regex. {reason_for_fallback}"
        # else, PyYAML was not available, and regex didn't find frontmatter, which is fine.

    return frontmatter, body, error


def markdown_to_html(md_body):
    """
    Converts Markdown text to HTML.
    Uses the Markdown package if available, otherwise falls back to basic regex.
    """
    if MARKDOWN_AVAILABLE:
        try:
            return markdown.markdown(md_body), None
        except Exception as e:
            return markdown_to_html_regex_fallback(md_body, f"Markdown package failed: {e}")

    return markdown_to_html_regex_fallback(md_body, "Markdown package not available.")

def markdown_to_html_regex_fallback(md_body, reason_for_fallback):
    """
    Fallback for converting Markdown to HTML using basic regex.
    """
    html_output = md_body
    # Headers H1-H6
    for i in range(6, 0, -1):
        html_output = re.sub(r'^{}\s+(.*)'.format('#'*i), r'<h{0}>\1</h{0}>'.format(i), html_output, flags=re.MULTILINE)

    # Bold
    html_output = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html_output)
    html_output = re.sub(r'__(.*?)__', r'<strong>\1</strong>', html_output)
    # Italics
    html_output = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html_output)
    html_output = re.sub(r'_(.*?)_', r'<em>\1</em>', html_output)
    # Links
    html_output = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', html_output)
    # Images
    html_output = re.sub(r'!\[(.*?)\]\((.*?)\)', r'<img src="\2" alt="\1"/>', html_output)

    # Paragraphs - this is a simplified approach
    # Split by double newlines, then wrap non-empty lines that are not already part of a block element
    paragraphs = []
    for para_block in html_output.split('\n\n'):
        para_block = para_block.strip()
        if para_block:
            # Avoid wrapping existing html tags like h1, etc. or if it's just an image/link on its own
            if not (para_block.startswith('<h') or para_block.startswith('<a href') or para_block.startswith('<img src')):
                 processed_para_block = para_block.replace('\\n', '<br>') # Corrected line
                 paragraphs.append(f"<p>{processed_para_block}</p>")
            else:
                 paragraphs.append(para_block) # Already a block element or special inline
    html_output = '\n'.join(paragraphs)

    error = None
    if "Markdown package failed" in reason_for_fallback:
        error = reason_for_fallback
    return html_output, error

def main(incoming_batch_dir_arg, staging_dir_arg):
    # Ensure paths are constructed starting from /app, which is the repo root in the sandbox
    base_app_path = "/app"
    full_incoming_path = os.path.join(base_app_path, "content_pipeline/incoming", incoming_batch_dir_arg)
    # staging_dir_arg is also relative to /app as per subtask description (e.g. /content_pipeline/staging/)
    # So, full_staging_path_for_batch should also be relative to /app
    full_staging_path_for_batch = os.path.join(base_app_path, staging_dir_arg.strip('/'), incoming_batch_dir_arg)


    if not os.path.exists(full_staging_path_for_batch):
        os.makedirs(full_staging_path_for_batch, exist_ok=True) # Added exist_ok=True

    processed_files_log = []
    error_log = []
    editorial_ai_messages = []

    if not os.path.isdir(full_incoming_path):
        error_msg = f"Error: Incoming batch directory not found: {full_incoming_path}"
        error_log.append(error_msg)
        print(json.dumps({
            "processed_files_log": processed_files_log,
            "error_log": error_log,
            "editorial_ai_messages": editorial_ai_messages
        }))
        return

    for filename in os.listdir(full_incoming_path):
        if filename.endswith(".md"):
            md_filepath = os.path.join(full_incoming_path, filename)
            base_filename = filename[:-3]
            status = "success"
            current_file_errors = []

            try:
                with open(md_filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                fm_parse_result = parse_frontmatter_and_body(content)
                frontmatter = {}
                body = ""
                parse_error_detail = None

                if len(fm_parse_result) == 3:
                    frontmatter, body, parse_error_detail = fm_parse_result
                else:
                    frontmatter, body = fm_parse_result

                if parse_error_detail:
                    current_file_errors.append(f"Frontmatter parsing issue for {filename}: {parse_error_detail}")

                html_body, md_conversion_error = markdown_to_html(body)
                if md_conversion_error:
                    current_file_errors.append(f"Markdown to HTML conversion issue for {filename}: {md_conversion_error}")

                metadata_filename = base_filename + "_metadata.json"
                html_filename = base_filename + ".html"

                metadata_out_path = os.path.join(full_staging_path_for_batch, metadata_filename)
                html_out_path = os.path.join(full_staging_path_for_batch, html_filename)

                try:
                    # Custom handler for JSON serialization of date/datetime objects
                    def json_serial(obj):
                        from datetime import date, datetime
                        if isinstance(obj, (datetime, date)):
                            return obj.isoformat()
                        raise TypeError(f"Type {type(obj)} not serializable")

                    with open(metadata_out_path, 'w', encoding='utf-8') as mf:
                        json.dump(frontmatter, mf, indent=4, default=json_serial)
                except Exception as e:
                    current_file_errors.append(f"Error writing metadata for {filename}: {e}")
                    status = "error"

                try:
                    with open(html_out_path, 'w', encoding='utf-8') as hf:
                        hf.write(html_body)
                except Exception as e:
                    current_file_errors.append(f"Error writing HTML for {filename}: {e}")
                    status = "error"

                if current_file_errors:
                    error_log.extend(current_file_errors)
                    status = "error"
                    editorial_ai_messages.append(f"Error processing {filename}. Check logs. Details: {'; '.join(current_file_errors)}")
                else:
                    editorial_ai_messages.append(f"Processed {filename}. Staged metadata and HTML.")

                processed_files_log.append({
                    "source": filename,
                    "metadata_out": metadata_filename,
                    "html_out": html_filename,
                    "status": status
                })

            except Exception as e:
                error_log.append(f"Failed to process file {filename}: {e}")
                processed_files_log.append({
                    "source": filename,
                    "metadata_out": None,
                    "html_out": None,
                    "status": "error"
                })
                editorial_ai_messages.append(f"Critical error processing {filename}. See error log.")

    print(json.dumps({
        "processed_files_log": processed_files_log,
        "error_log": error_log,
        "editorial_ai_messages": editorial_ai_messages,
        "pyyaml_available": PYYAML_AVAILABLE,
        "markdown_available": MARKDOWN_AVAILABLE
    }))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({
            "processed_files_log": [],
            "error_log": ["Usage: python process_markdown.py <incoming_batch_dir> <staging_dir_root>"],
            "editorial_ai_messages": []
        }))
        sys.exit(1)

    incoming_batch_dir_arg = sys.argv[1]
    staging_dir_arg = sys.argv[2]
    main(incoming_batch_dir_arg, staging_dir_arg)
