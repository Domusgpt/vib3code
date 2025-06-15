import json
import re
import os
import sys

def format_js_object(py_dict):
    """
    Converts a Python dictionary (especially with nested dicts like colorShift)
    into a JavaScript object literal string.
    This is a simplified formatter; robust JS formatting can be complex.
    """
    parts = []
    for key, value in py_dict.items():
        js_key = key
        if '.' in key: # Handle keys like "colorShift.h" -> "colorShift: { h: ... }"
            # This basic formatter won't try to deeply nest here.
            # Assumes suggestions are already structured correctly for simple conversion,
            # or STYLE_GUIDANCE.md rules produce flat keys like 'colorShift_h' for now.
            # For this subtask, the `theme_suggestions.json` has flat keys for colorShift.
            # E.g. "colorShift.h": 210 will become "colorShift.h": 210 in JS.
            # A better approach would be to structure suggestions as nested dicts
            # and have this function handle it, or have the suggestion script produce
            # JS-ready structure.
            # The current theme_suggestions.json output has keys like "colorShift.h".
            # This will result in "colorShift.h": value, which is NOT valid JS for nested.
            # Let's assume the input py_dict keys are directly usable as JS keys or
            # we will restructure the input py_dict before this function.
            # For this script, we'll assume the suggestions are already structured
            # such that keys are valid JS identifiers (or quoted if needed) and
            # values are simple.
            # The target `sectionModifiers` has e.g. `colorShift: { h: 0, s: 0, l: 0 }`
            # The `suggested_sectionModifier_params` from `theme_suggestions.json` has:
            #   "colorShift.h": 210, "colorShift.s": 0, "colorShift.l": -15
            # This needs to be converted to:
            #   colorShift: { h: 210, s: 0, l: -15 }
            pass # This will be handled by a pre-formatting step.


        if isinstance(value, str):
            parts.append(f'"{js_key}": "{value}"') # Quote string values
        elif isinstance(value, bool):
            parts.append(f'"{js_key}": {str(value).lower()}') # true/false
        elif isinstance(value, dict): # For nested objects like colorShift
             nested_parts = []
             for nk, nv in value.items():
                 if isinstance(nv, str):
                     nested_parts.append(f'"{nk}": "{nv}"')
                 else:
                     nested_parts.append(f'"{nk}": {nv}')
             parts.append(f'"{js_key}": {{ {", ".join(nested_parts)} }}')
        else: # Numbers
            parts.append(f'"{js_key}": {value}')

    return f"{{ {', '.join(parts)} }}"

def restructure_suggestions_for_js(suggested_params):
    """
    Restructures flat dot-notation keys (e.g., "colorShift.h") into nested dicts
    and ensures keys are valid for JS or appropriately quoted if they contain special chars.
    """
    js_params = {}
    color_shift_temp = {}

    for key, value in suggested_params.items():
        if key.startswith("colorShift."):
            sub_key = key.split(".")[1]
            color_shift_temp[sub_key] = value
        else:
            # Basic check for valid JS identifier (simplistic)
            # Keys in sectionModifiers are simple identifiers, so direct use is fine.
            js_params[key] = value

    if color_shift_temp:
        js_params["colorShift"] = color_shift_temp

    # Now format for JS string (keys might need quotes if not simple identifiers)
    # The format_js_object function will handle quoting string keys.

    # Manual formatting for the specific structure of sectionModifiers
    # This ensures correct JS syntax for nested objects.
    output_parts = []
    for key, value in js_params.items():
        js_key_str = f'"{key}"' # Always quote keys from suggestions for safety

        if key == "colorShift" and isinstance(value, dict):
            cs_parts = []
            for cs_key, cs_val in value.items():
                cs_parts.append(f'"{cs_key}": {cs_val}')
            value_str = f'{{ {", ".join(cs_parts)} }}'
        elif isinstance(value, str):
            value_str = f'"{value}"'
        elif isinstance(value, bool):
            value_str = str(value).lower()
        else: # Number
            value_str = str(value)
        output_parts.append(f"{js_key_str}: {value_str}")

    return f"{{ {', '.join(output_parts)} }}"


def apply_suggestions(theme_engine_file_path, theme_suggestions_file_path):
    errors = []
    changes_summary = ""

    try:
        with open(theme_suggestions_file_path, 'r', encoding='utf-8') as f:
            suggestions_data = json.load(f)
    except Exception as e:
        errors.append(f"Error loading theme suggestions: {e}")
        return "failure", None, "", errors

    target_article_id = suggestions_data.get("applies_to_article_id")
    suggested_params = suggestions_data.get("suggested_sectionModifier_params")

    if not target_article_id or not suggested_params:
        errors.append("Theme suggestions file is missing 'applies_to_article_id' or 'suggested_sectionModifier_params'.")
        return "failure", None, "", errors

    # For this subtask, create a unique key for the new modifier
    # In a real system, target_section_key might come from suggestions_data or be more sophisticated.
    target_section_key = f"article_{target_article_id}_custom"
                                                        # Replace non-alphanum chars if article_id can have them
    target_section_key = re.sub(r'[^a-zA-Z0-9_]', '_', target_section_key)


    # Convert Python dict to a JS object literal string
    # The suggested_params from JSON are flat, e.g. "colorShift.h". Need to make nested for JS.
    js_object_string = restructure_suggestions_for_js(suggested_params)
    if not js_object_string or js_object_string == "{ }": # If restructure failed or params were empty
        errors.append(f"Failed to format JS object string from suggestions: {suggested_params}")
        return "failure", theme_engine_file_path, "Formatted JS object string is empty.", errors


    try:
        with open(theme_engine_file_path, 'r', encoding='utf-8') as f:
            theme_engine_content = f.read()
    except Exception as e:
        errors.append(f"Error reading theme engine file: {e}")
        return "failure", None, "", errors

    # Locate the `this.sectionModifiers = {` block.
    # This regex aims to find the start and the end of the object.
    section_modifiers_match = re.search(r'(this\.sectionModifiers\s*=\s*\{)([\s\S]*?)(\n\s*\};)', theme_engine_content)

    if not section_modifiers_match:
        errors.append("Could not find 'this.sectionModifiers' object in theme-engine-clean.js.")
        return "failure", theme_engine_file_path, "sectionModifiers object not found.", errors

    prefix = section_modifiers_match.group(1) # "this.sectionModifiers = {"
    middle_content = section_modifiers_match.group(2).strip() # Content between {}
    suffix = section_modifiers_match.group(3) # "\n    };"

    new_entry = f'\n            "{target_section_key}": {js_object_string}'

    # Add a comma if middle_content is not empty and doesn't end with a comma
    if middle_content and not middle_content.endswith(','):
        new_middle_content = middle_content + ',' + new_entry
    else: # Empty or already ends with comma
        new_middle_content = middle_content + new_entry

    # Ensure the last real item has a comma if we add more, but the very last one before '}' should not.
    # Simpler: just add the new entry, then ensure the *overall* structure is okay.
    # The new_entry itself should NOT end with a comma if it's the truly last one.
    # However, we are inserting it into a list, so it should have a comma if more follow.
    # For robustly adding as the last item (before the closing brace):

    # Let's find the last occurrence of `},` or `{` if the object is empty/single-line
    # and insert before the final `}` of the `sectionModifiers` block.

    # Revised insertion: find the end of the existing content within braces
    # and insert the new item there, ensuring proper comma handling.

    # Safest way to add a new key:
    # Find the last property. If it has a trailing comma, good. If not, add one.
    # Then add the new property, without a trailing comma itself.

    # Simpler: Add the new entry. It will be the last one before the suffix `\n    };`
    # So, the new_entry should NOT have a trailing comma.
    # The `new_middle_content` calculation above handles adding a comma to the previous last item.

    # If the `middle_content` was empty, `new_middle_content` will just be `new_entry`
    # If `middle_content` was `\n            "some_key": {}`, it becomes `\n            "some_key": {}, \n            "new_key": {}`

    # The suffix starts with \n, so new_middle_content doesn't need a trailing \n if it's not empty.
    # If middle_content was empty, new_middle_content is `\n            "new_key": {}`
    # If middle_content was not empty, it's `EXISTING_CONTENT, \n            "new_key": {}`

    # Ensure there's a newline before the new entry if middle_content was not empty
    if middle_content:
        final_middle_content = new_middle_content # Already has comma and newline from new_entry structure
    else: # sectionModifiers was empty
        final_middle_content = new_entry.lstrip() # Remove leading newline if it's the first entry

    updated_theme_engine_content = prefix + final_middle_content + suffix

    try:
        with open(theme_engine_file_path, 'w', encoding='utf-8') as f:
            f.write(updated_theme_engine_content)
        changes_summary = f"Added new section modifier: {target_section_key}"
        status = "success"
    except Exception as e:
        errors.append(f"Error writing updated theme engine file: {e}")
        status = "failure"

    return status, theme_engine_file_path, changes_summary, errors


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({
            "status": "failure",
            "modified_file": None,
            "changes_summary": "",
            "editorial_ai_message": "Error: Incorrect arguments. Usage: python apply_theme_suggestions.py <theme_engine_file_path> <theme_suggestions_file_path>",
            "errors": ["Incorrect number of arguments provided."]
        }))
        sys.exit(1)

    engine_path_arg = sys.argv[1]
    suggestions_path_arg = sys.argv[2]

    status_res, mod_file, summary_res, err_list = apply_suggestions(engine_path_arg, suggestions_path_arg)

    # Construct final AI message
    article_id_for_msg = "unknown_article"
    try:
        with open(suggestions_path_arg, 'r', encoding='utf-8') as f_sugg:
            sugg_data = json.load(f_sugg)
            article_id_for_msg = sugg_data.get("applies_to_article_id", "unknown_article")
    except: # pylint: disable=bare-except
        pass

    ai_msg = ""
    if status_res == "success":
        ai_msg = f"Applied theme suggestions for article '{article_id_for_msg}' (as modifier '{summary_res.split(': ')[-1]}') to theme-engine-clean.js."
    else:
        ai_msg = f"Failed to apply theme suggestions for article '{article_id_for_msg}' to theme-engine-clean.js."
        if err_list:
             ai_msg += f" Errors: {'; '.join(err_list)}"


    print(json.dumps({
        "status": status_res,
        "modified_file": mod_file,
        "changes_summary": summary_res,
        "editorial_ai_message": ai_msg,
        "errors": err_list
    }))
