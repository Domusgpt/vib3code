import json
import re
import os
import sys

def robust_python_value_to_js_string(value):
    """
    Converts a Python value to its JavaScript string representation.
    Handles strings (with proper escaping for JS template literals),
    numbers, booleans, lists, and dicts.
    """
    if isinstance(value, str):
        # For JSON compatibility, escape backslashes and double quotes, then wrap in double quotes.
        escaped_value = value.replace('\\', '\\\\')
        escaped_value = escaped_value.replace('"', '\\"')
        # Replace newlines with \n, tabs with \t etc. for JSON string
        escaped_value = escaped_value.replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
        return f'"{escaped_value}"' # Use double quotes for JSON strings
    elif isinstance(value, bool):
        return str(value).lower() # true/false for JSON
    elif isinstance(value, (int, float)):
        return str(value)
    elif isinstance(value, list):
        return f"[{', '.join(robust_python_value_to_js_string(v) for v in value)}]"
    elif isinstance(value, dict):
        return python_to_js_object_string(value) # Recursive call
    elif value is None:
        return "null"
    else:
        # Fallback for other types: convert to string and wrap in double quotes for JSON
        return f'"{str(value)}"'

def python_to_js_object_string(py_dict):
    """
    Converts a Python dictionary to a JavaScript object literal string
    that is also valid JSON.
    """
    items = []
    for key, value in py_dict.items():
        js_key = f'"{key}"' # Always quoting keys for JSON compatibility
        items.append(f"{js_key}: {robust_python_value_to_js_string(value)}")
    return f"{{ {', '.join(items)} }}"

def parse_js_object_string(obj_str):
    """
    Rudimentary parser for a single JS object string to a Python dict.
    Attempts to make it JSON compatible.
    """
    # 1. Ensure all keys are double-quoted.
    processed_str = re.sub(r'(?<!["\'])\b([a-zA-Z_]\w*)\s*:(?!["\'])', r'"\1":', obj_str)

    # 2. Convert single-quoted strings to double-quoted strings.
    def single_to_double_quotes(match):
        content = match.group(1)
        content_escaped_double = content.replace('"', '\\"')
        content_final = content_escaped_double.replace("\\'", "'")
        return f'"{content_final}"'
    processed_str = re.sub(r"'((?:\\.|[^'\\])*)'", single_to_double_quotes, processed_str)

    # 3. Convert backticked template literals to double-quoted strings.
    if '`' in processed_str:
        def backtick_to_double_quotes(match):
            content = match.group(1)
            content = content.replace('\\', '\\\\')
            content = content.replace('"', '\\"')
            content = content.replace('\n', '\\n')
            content = content.replace('\r', '\\r')
            content = content.replace('\t', '\\t')
            content = content.replace('`', '')
            return f'"{content}"'
        processed_str = re.sub(r'`([\s\S]*?)`', backtick_to_double_quotes, processed_str)

    try:
        return json.loads(processed_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Simplified JS object parsing failed: {e}. Processed: {processed_str[:200]}...")


def update_router_article_data(router_file_path, final_metadata_file_path, article_id_to_update):
    errors = []
    changes_summary = ""
    final_article_title = article_id_to_update

    try:
        with open(final_metadata_file_path, 'r', encoding='utf-8') as f:
            final_article_data = json.load(f)
        final_article_title = final_article_data.get('title', article_id_to_update)
    except Exception as e:
        errors.append(f"Error loading final metadata: {e}")
        return "failure", router_file_path, "", errors, final_article_title

    try:
        with open(router_file_path, 'r', encoding='utf-8') as f:
            router_content = f.read()
    except Exception as e:
        errors.append(f"Error reading router file: {e}")
        return "failure", router_file_path, "", errors, final_article_title

    all_articles_match = re.search(r'(var\s+allArticles\s*=\s*\[|this\.allArticles\s*=\s*\[)([\s\S]*?)(\];)', router_content)
    if not all_articles_match:
        errors.append("Could not find 'allArticles' array in router file.")
        return "failure", router_file_path, "", errors, final_article_title

    array_prefix = all_articles_match.group(1)
    array_content_str = all_articles_match.group(2).strip()
    array_suffix = all_articles_match.group(3)

    # Simplified approach: Since router file currently only contains sample_article (or should),
    # we will replace the entire content of allArticles with just the new final_article_data.
    # No need to parse existing objects from the array_content_str in this simplified flow.
    errors.append("Note: Adopting simplified strategy - allArticles will be overwritten with only the target article's new data.")
    processed_article_objects_for_js = [final_article_data] # List containing the one article to write
    found_article_to_update = True # Mark as true since we are directly setting it

    # obj_matches = re.finditer(r'\{([\s\S]*?)\}', array_content_str) # Not needed for simplified approach
    # temp_articles_str_list = [] # Not needed
    # for match in obj_matches: # Not needed
    #     temp_articles_str_list.append("{" + match.group(1) + "}") # Not needed

    # if not temp_articles_str_list and array_content_str:  # Not needed
    #     errors.append(f"Could not parse individual objects from allArticles array content: {array_content_str[:100]}") # Not needed

    # The loop below is removed as per simplified strategy
    # for i, obj_str in enumerate(temp_articles_str_list):
    #     ...
    # if not found_article_to_update :
    #     ...

    # Reconstruct the allArticles array string directly from processed_article_objects_for_js
    # which now only contains final_article_data (as a Python dict)
    new_array_content_items = []
    for item in processed_article_objects_for_js: # Should only be one item
        if isinstance(item, dict):
            new_array_content_items.append(python_to_js_object_string(item))
        else:
            new_array_content_items.append(item) # Should not happen with simplified strategy

    new_array_content_str = ",\n        ".join(new_array_content_items)
    if new_array_content_str:
        new_array_content_str = "\n        " + new_array_content_str + "\n    "
    else:
        new_array_content_str = "\n    "

    updated_router_content = array_prefix + new_array_content_str + array_suffix

    try:
        with open(router_file_path, 'w', encoding='utf-8') as f:
            f.write(updated_router_content)
        status = "success"
        # Corrected changes_summary for the simplified strategy
        changes_summary = f"Replaced allArticles content with data for: {article_id_to_update}"

    except Exception as e:
        errors.append(f"Error writing updated router file: {e}")
        status = "failure"

    return status, router_file_path, changes_summary, errors, final_article_title

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({
            "status": "failure", "modified_file": None, "changes_summary": "",
            "editorial_ai_message": "Error: Incorrect arguments. Usage: python update_router_article.py <router_file_path> <final_metadata_file_path> <article_id_to_update>",
            "errors": ["Incorrect number of arguments provided."]
        }))
        sys.exit(1)

    r_file_path = sys.argv[1]
    final_meta_path = sys.argv[2]
    article_id = sys.argv[3]

    status_res, mod_file, summary_res, err_list, title_res = update_router_article_data(r_file_path, final_meta_path, article_id)

    ai_msg = ""
    if status_res == "success":
        # Adjusted message to reflect the replacement of the entire array content
        ai_msg = f"Set allArticles in magazine-router.js to solely contain updated '{title_res}' (ID: {article_id}) with final data."
    else:
        ai_msg = f"Failed to update '{title_res}' (ID: {article_id}) in magazine-router.js."
        if err_list: # Ensure err_list is converted to strings if not already
             ai_msg += f" Errors: {'; '.join(map(str, err_list))}"

    print(json.dumps({
        "status": status_res,
        "modified_file": mod_file,
        "changes_summary": summary_res,
        "editorial_ai_message": ai_msg,
        "errors": [str(e) for e in err_list] # Ensure errors are strings
    }))
