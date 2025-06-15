import json
import re
import os
import sys

# Default parameters, conceptually from a generic or 'home' section modifier
# These would be the starting point before applying keyword-based adjustments.
DEFAULT_THEME_PARAMS = {
    "colorShift.h": 0, # Neutral, actual hue would come from base theme or explicit color keyword
    "colorShift.s": 0,
    "colorShift.l": 0,
    "intensity": 1.0,
    "particleCount": 100,
    "animationStyle": "smooth",
    "visualComplexity": "medium"
}

# Simple map for common color names to HSL Hue values (extendable)
# For this version, we'll primarily use direct HSL settings or explicit H values from keywords.
# This map is more for a conceptual "color name -> HSL" feature.
COLOR_NAME_TO_HSL_HUE = {
    "red": 0,
    "orange": 30,
    "yellow": 60,
    "green": 120,
    "cyan": 180,
    "blue": 210, # Default VIB3CODE blue often around this
    "purple": 270,
    "magenta": 300,
    "pink": 330
}

def parse_style_guidance_rules(style_guidance_path):
    rules = {}
    try:
        with open(style_guidance_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find the "Visual Mood Keyword Mapping" section
        mapping_section_match = re.search(r'###\s*Visual Mood Keyword Mapping for AI Suggestions([\s\S]*?)(?=###|\Z)', content, re.IGNORECASE)
        if not mapping_section_match:
            return {}

        section_content = mapping_section_match.group(1)

        # Regex to find lines like: *   **keyword**: param(value), param2(+value)
        rule_pattern = re.compile(r'^\s*\*\s*\*\*(.+?)\*\*\s*:\s*(.+?)\s*$', re.MULTILINE)
        param_pattern = re.compile(r'([a-zA-Z0-9._]+)\s*\(([-+*/]?\s*".*?"|[-+*/]?\s*[\d.]+)\)') # Handles quoted strings or numbers with ops

        for match in rule_pattern.finditer(section_content):
            keyword = match.group(1).strip().lower()
            params_str = match.group(2)

            keyword_rules = {}
            for p_match in param_pattern.finditer(params_str):
                param_name = p_match.group(1)
                value_str = p_match.group(2).strip()

                op = None
                actual_value_str = value_str

                if value_str.startswith(('+', '-', '*', '/')):
                    op = value_str[0]
                    actual_value_str = value_str[1:].strip()

                # Try to convert to number, else it's a string (remove quotes if any)
                try:
                    if '.' in actual_value_str:
                        val = float(actual_value_str)
                    else:
                        val = int(actual_value_str)
                except ValueError:
                    val = actual_value_str.strip('"') # String value

                keyword_rules[param_name] = {"value": val, "op": op}
            rules[keyword] = keyword_rules
    except Exception as e:
        # Log error if needed, for now, just return empty rules on failure
        print(f"Error parsing style guidance: {e}", file=sys.stderr) # Optional debug
        pass
    return rules

def parse_visual_mood(visual_mood_str):
    mood_str = visual_mood_str.lower()
    # Basic tokenization: split by space, comma, underscore. Remove empty.
    keywords = [kw.strip() for kw in re.split(r'[\s,_-]+', mood_str) if kw.strip()]

    color_hints = {"hex": [], "name": []}
    # Very basic hex color detection
    for kw in keywords:
        if re.match(r'^#([0-9a-fA-F]{3}){1,2}$', kw):
            color_hints["hex"].append(kw)
        elif kw in COLOR_NAME_TO_HSL_HUE:
             color_hints["name"].append(kw)

    # Filter out color keywords from general keywords if they were parsed as color hints
    general_keywords = [kw for kw in keywords if kw not in color_hints["hex"] and kw not in color_hints["name"]]
    return general_keywords, color_hints

def apply_rules(current_params, rules_to_apply):
    # rules_to_apply is like {'colorShift.l': {'value': -15, 'op': None}, 'intensity': {'value': 0.8, 'op': '*'}}}
    for param_key, rule in rules_to_apply.items():
        val = rule["value"]
        op = rule["op"]

        if op is None: # Direct assignment
            current_params[param_key] = val
        elif op == '+':
            current_params[param_key] = current_params.get(param_key, 0) + val # Default to 0 if not set for +/-
        elif op == '-':
            current_params[param_key] = current_params.get(param_key, 0) - val
        elif op == '*':
            current_params[param_key] = current_params.get(param_key, 1) * val # Default to 1 for */
        elif op == '/':
            if val != 0: # Avoid division by zero
                current_params[param_key] = current_params.get(param_key, 1) / val
            else:
                # Log error or handle division by zero appropriately
                pass
    return current_params

def generate_visual_suggestions(metadata_file_path, style_guidance_path, output_suggestions_path):
    errors = []
    suggestions_generated = False
    ai_interpretation_parts = []

    try:
        with open(metadata_file_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except Exception as e:
        errors.append(f"Error loading metadata: {e}")
        return False, "Error loading metadata.", errors, None

    article_id = metadata.get("id", os.path.basename(metadata_file_path).replace("_metadata.json", ""))
    visual_mood = metadata.get("visual_mood")

    if not visual_mood:
        return False, "No 'visual_mood' found in metadata.", errors, None

    style_rules = parse_style_guidance_rules(style_guidance_path)
    if not style_rules:
        errors.append("No rules parsed from style guidance or error during parsing.")
        # Continue with default params if mood is present but no rules? Or just exit?
        # For now, let's say if rules are essential and missing, we can't do much.
        # However, color name/hex parsing could still work.

    mood_keywords, color_hints = parse_visual_mood(visual_mood)

    # Start with default ThemeEngine parameters (or a copy of 'home' section's params)
    suggested_params = DEFAULT_THEME_PARAMS.copy()
    ai_interpretation_parts.append(f"Interpreting visual mood: '{visual_mood}'.")


    # Apply rules based on general keywords
    for kw in mood_keywords:
        if kw in style_rules:
            rules_for_kw = style_rules[kw]
            suggested_params = apply_rules(suggested_params, rules_for_kw)
            ai_interpretation_parts.append(f"Keyword '{kw}' suggests: {json.dumps(rules_for_kw)}.")
            suggestions_generated = True

    # Handle color hints (simplified: take the first detected color name/hex for HSL hue)
    # A more complex system would average hues or derive a palette.
    if color_hints["name"]:
        first_color_name = color_hints["name"][0]
        if first_color_name in COLOR_NAME_TO_HSL_HUE:
            suggested_params["colorShift.h"] = COLOR_NAME_TO_HSL_HUE[first_color_name]
            ai_interpretation_parts.append(f"Color name '{first_color_name}' suggests Hue: {suggested_params['colorShift.h']}.")
            suggestions_generated = True
    # Basic HEX to HSL conversion is too complex for this script without more robust color libraries.
    # For now, we'll just note if a hex was found.
    if color_hints["hex"]:
         ai_interpretation_parts.append(f"Hex color(s) {color_hints['hex']} found. Advanced conversion to HSL not yet implemented; consider manual HSL values for these.")
         # If we had a robust hex->HSL:
         # h,s,l = convert_hex_to_hsl(color_hints["hex"][0])
         # suggested_params["colorShift.h"] = h ... etc.

    # Assemble Rationale and AI Interpretation
    ai_interpretation = " ".join(ai_interpretation_parts)
    rationale = "Suggestions are based on matching keywords from 'visual_mood' to rules in STYLE_GUIDANCE.md and interpreting explicit color mentions."
    if not suggestions_generated and not errors:
        ai_interpretation = f"Visual mood '{visual_mood}' did not strongly map to any defined keyword rules or simple color hints for parameter changes."
        rationale = "No specific parameter changes suggested based on current rules and mood string."


    # Format output JSON
    output_data = {
        "applies_to_article_id": article_id,
        "source_visual_mood": visual_mood,
        "ai_interpretation": ai_interpretation,
        "suggested_sectionModifier_params": suggested_params if suggestions_generated else {}, # Only include if suggestions were made
        "rationale": rationale,
        "style_guidance_rules_found": bool(style_rules),
        "parsed_mood_keywords": mood_keywords,
        "parsed_color_hints": color_hints
    }

    try:
        os.makedirs(os.path.dirname(output_suggestions_path), exist_ok=True)
        with open(output_suggestions_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=4)
    except Exception as e:
        errors.append(f"Error writing suggestions to JSON file: {e}")
        return suggestions_generated, "Error writing suggestions to file.", errors, None

    final_message = "Visual theme suggestions generated." if suggestions_generated else "No specific visual theme suggestions generated based on mood."
    if errors:
        final_message += " Encountered errors."

    return suggestions_generated, final_message, errors, output_suggestions_path


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({
            "output_suggestions_file_path": None,
            "suggestions_generated": False,
            "editorial_ai_message": "Error: Incorrect arguments. Usage: python suggest_visuals.py <metadata_file_path> <style_guidance_path> <output_suggestions_path>",
            "errors": ["Incorrect number of arguments provided."]
        }))
        sys.exit(1)

    meta_path_arg = sys.argv[1]
    style_path_arg = sys.argv[2]
    output_path_arg = sys.argv[3]

    sg, msg, err_list, out_file_path = generate_visual_suggestions(meta_path_arg, style_path_arg, output_path_arg)

    print(json.dumps({
        "output_suggestions_file_path": out_file_path,
        "suggestions_generated": sg,
        "editorial_ai_message": msg,
        "errors": err_list
    }))
