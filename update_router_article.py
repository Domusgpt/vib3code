import json
import re
import os
import sys

# robust_python_value_to_js_string, python_to_js_object_string, and parse_js_object_string
# are removed as per new strategy using json.loads and json.dumps.

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

    existing_articles_list = []
    if array_content_str: # If not empty or just whitespace
        try:
            # The content is a list of JS objects, e.g. "{...}, {...}".
            # To parse as JSON, it needs to be enclosed in '[]'
            # unless it's already a valid JSON array string (which it might be).
            # For robustness, we assume it's the content *inside* the array.
            json_parsable_array_content = f"[{array_content_str}]"
            existing_articles_list = json.loads(json_parsable_array_content)
        except json.JSONDecodeError as e:
            errors.append(f"Error parsing existing allArticles content: {e}. Content preview: {array_content_str[:200]}")
            # Decide if this is fatal. For now, let's try to continue by overwriting with new article if parsing fails.
            # Or, return failure. Let's return failure.
            return "failure", router_file_path, f"Failed to parse existing articles in {router_file_path}", errors, final_article_title

    new_article_id = final_article_data.get('id')
    if not new_article_id:
        errors.append("New article data is missing 'id' field.")
        return "failure", router_file_path, "New article data missing 'id'", errors, final_article_title

    article_updated = False
    for i, existing_article in enumerate(existing_articles_list):
        if isinstance(existing_article, dict) and existing_article.get('id') == new_article_id:
            existing_articles_list[i] = final_article_data
            article_updated = True
            break

    if article_updated:
        changes_summary = f"Updated article with ID '{new_article_id}' ('{final_article_title}') in {os.path.basename(router_file_path)}."
    else:
        existing_articles_list.append(final_article_data)
        changes_summary = f"Added new article with ID '{new_article_id}' ('{final_article_title}') to {os.path.basename(router_file_path)}."

    # Convert the list of dictionaries back to a pretty-printed JSON string
    # Ensure consistent newlines and indentation for array elements.
    if existing_articles_list:
        new_array_content_json_str = json.dumps(existing_articles_list, indent=4)
        # Add a newline after array_prefix if it doesn't end with one (it usually does, e.g. "var allArticles = [")
        # And a newline before array_suffix if it doesn't start with one (it usually does, e.g. "];")
        # json.dumps output for a list will start with '[' and end with ']', but we want the content *inside* the main array.
        # The regex captures `var allArticles = [` as prefix and `];` as suffix.
        # So, the output of json.dumps (which is a full array string "[\n    {...}\n]") needs to be stripped of its outer brackets
        # if the prefix and suffix provide them.
        # Current regex: (var\s+allArticles\s*=\s*\[|this\.allArticles\s*=\s*\[)  <- group 1 (prefix)
        # ([\s\S]*?)                                                              <- group 2 (content)
        # (\];)                                                                  <- group 3 (suffix)
        # So, new_array_content_json_str from json.dumps is already a complete array string.
        # We need to replace group 2 with the content of this new string.
        # Example: json.dumps([{"id":"1"}], indent=4) -> "[\n    {\n        \"id\": \"1\"\n    }\n]"
        # We need to fit this between `array_prefix` (e.g. "var allArticles = [") and `array_suffix` (e.g. "];")
        # This means `json.dumps` output should be used directly as the new content for the JS array.
        # However, the current regex extracts the *content* of the array.
        # Let's adjust: the new_array_content_str should be the content *between* the prefix's '[' and suffix's ']'.

        # If existing_articles_list is not empty, json.dumps will produce "[\n    {...}\n]"
        # If it's empty, it will produce "[]"
        # We need to format it nicely.
        if not existing_articles_list: # Handle empty list explicitly for cleaner output
             new_array_internal_content_str = ""
        else:
            # json.dumps produces a full JSON array string.
            # We want each object indented.
            # A common style:
            # var allArticles = [
            #     {...},
            #     {...}
            # ];
            # So, each item from json.dumps should be indented.
            # Let's make each item string, then join with ',\n' and indent.
            items_str_list = []
            for article_dict in existing_articles_list:
                # Convert each dict to a JSON string, compact (no newlines within object) for this style
                # but then indent each line of the object if we use indent in dumps for the object itself.
                # Easier: json.dumps the whole list with indent, then adjust.
                items_str_list.append(json.dumps(article_dict, indent=4)) # Indent objects themselves

            # Indent each item block for the array structure
            # Example: if an item_str is "{\n    \"id\": \"1\"\n}", it becomes "    {\n        \"id\": \"1\"\n    }"
            base_indent_for_array_items = "    " # Assuming array content starts after a newline and initial indent
            formatted_items = []
            for item_json_str in items_str_list:
                indented_item_lines = [base_indent_for_array_items + line for line in item_json_str.split('\n')]
                formatted_items.append('\n'.join(indented_item_lines))

            if formatted_items:
                new_array_internal_content_str = "\n" + ",\n".join(formatted_items) + "\n"
            else: # Should not happen if existing_articles_list was not empty
                new_array_internal_content_str = ""

    else: # existing_articles_list is empty
        new_array_internal_content_str = "" # Results in `[]`

    # Reconstruct the entire file content
    # router_content[:all_articles_match.start(0)] # Content before the 'allArticles' definition
    # + array_prefix # The 'var allArticles = [' part
    # + new_array_internal_content_str # The new content of the array, like '\n    {...}\n' or '' if empty
    # + array_suffix.strip() # The '];' part, stripped of any extra whitespace from regex capture
    # + router_content[all_articles_match.end(0):] # Content after the 'allArticles' definition

    # all_articles_match.group(0) is the entire matched string for `allArticles`
    # e.g. "var allArticles = [\n    {...}\n];"
    # We want to replace this whole segment.

    new_all_articles_definition = array_prefix + new_array_internal_content_str + array_suffix.strip()

    updated_router_content = router_content[:all_articles_match.start(0)] + \
                             new_all_articles_definition + \
                             router_content[all_articles_match.end(0):]

    try:
        with open(router_file_path, 'w', encoding='utf-8') as f:
            f.write(updated_router_content)
        status = "success"
        # changes_summary is set above based on add/update
    except Exception as e:
        errors.append(f"Error writing updated router file: {e}")
        status = "failure"
        changes_summary = f"Failed to write changes to {os.path.basename(router_file_path)} for article ID '{new_article_id}'."

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
        # summary_res already indicates if added or updated.
        # Example summary_res: "Updated article with ID '...' in magazine-router.js."
        # or "Added new article with ID '...' to magazine-router.js."
        # We can make ai_msg more direct.
        if "Updated" in summary_res:
            ai_msg = f"Successfully updated article '{title_res}' (ID: {article_id}) in {os.path.basename(mod_file)}."
        elif "Added" in summary_res:
            ai_msg = f"Successfully added new article '{title_res}' (ID: {article_id}) to {os.path.basename(mod_file)}."
        else: # Fallback, though summary_res should match one of the above
            ai_msg = f"Successfully processed article '{title_res}' (ID: {article_id}) in {os.path.basename(mod_file)}. Details: {summary_res}"
    else:
        ai_msg = f"Failed to process article '{title_res}' (ID: {article_id}) in {os.path.basename(mod_file or r_file_path)}."
        if err_list:
             ai_msg += f" Errors: {'; '.join(map(str, err_list))}"

    print(json.dumps({
        "status": status_res,
        "modified_file": mod_file,
        "changes_summary": summary_res,
        "editorial_ai_message": ai_msg,
        "errors": [str(e) for e in err_list] # Ensure errors are strings
    }))
