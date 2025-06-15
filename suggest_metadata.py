import json
import re
import os
import sys
from collections import Counter

# Attempt to import advanced libraries
BS4_AVAILABLE = False
try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    pass

NLTK_AVAILABLE = False
NLTK_STOPWORDS = []
NLTK_SENT_TOKENIZE = None
NLTK_WORD_TOKENIZE = None
NLTK_FREQ_DIST = None
try:
    import nltk
    from nltk.tokenize import sent_tokenize, word_tokenize
    from nltk.tokenize import sent_tokenize, word_tokenize
    from nltk.corpus import stopwords # Moved import here
    from nltk.probability import FreqDist # Moved import here

    # Attempt to load NLTK resources and set NLTK_AVAILABLE flag
    try:
        # These assignments will try to use the respective tokenizers/data.
        # If 'punkt' or 'stopwords' data is missing, a LookupError will be raised here.
        NLTK_STOPWORDS = stopwords.words('english')
        _ = sent_tokenize("test sentence.") # Test punkt
        _ = word_tokenize("test sentence") # Test word tokenizer (which might also use punkt resources)

        # If all above succeeded, assign them for use
        NLTK_SENT_TOKENIZE = sent_tokenize
        NLTK_WORD_TOKENIZE = word_tokenize
        NLTK_FREQ_DIST = FreqDist
        NLTK_AVAILABLE = True

    except LookupError:
        NLTK_AVAILABLE = False # Explicitly set to False on LookupError
        # Fallback mechanisms will be used by the script's functions.
        # No need to attempt nltk.download() here as it's unreliable in sandboxes
        # and the script is designed with fallbacks.
    except ImportError: # If NLTK itself is not installed
        NLTK_AVAILABLE = False
    except Exception: # Catch any other NLTK-related exception during setup
        NLTK_AVAILABLE = False

except ImportError: # If the initial `import nltk` fails
    NLTK_AVAILABLE = False

# Fallback stopwords list if NLTK is not available or fails
FALLBACK_STOPWORDS = [
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "did", "do",
    "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", "having",
    "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it",
    "its", "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "o", "of", "on",
    "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "s", "same", "she", "should",
    "so", "some", "such", "t", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there",
    "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "were",
    "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "you", "your", "yours",
    "yourself", "yourselves", "article", "section", "page", "chapter", "paragraph", "fig", "figure", "table",
    "title", "subject", "date", "author", "content", "text", "example", "examples", "however", "therefore",
    "introduction", "conclusion", "summary", "abstract", "detail", "details", "information", "issue", "issues",
    "solution", "solutions", "problem", "problems", "context", "background", "overview", "analysis", "study",
    "approach", "method", "methods", "result", "results", "discussion", "reference", "references", "appendix"
]


def extract_text_from_html(html_content):
    if BS4_AVAILABLE:
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            return soup.get_text(separator=' ', strip=True)
        except Exception: # pylint: disable=broad-except
            # Fallback if BS4 fails for some reason
            return re.sub(r'<[^<]+?>', ' ', html_content)
    else:
        return re.sub(r'<[^<]+?>', ' ', html_content)

def preprocess_text(text, use_nltk_stopwords=True):
    text = text.lower()
    text = re.sub(r'[^\w\s\.\?!]', '', text) # Keep sentence enders for sentence tokenization

    if NLTK_AVAILABLE and NLTK_WORD_TOKENIZE:
        words = NLTK_WORD_TOKENIZE(text)
    else:
        # Basic word tokenization: split by space, then filter out empty strings from punctuation removal
        words = [word for word in re.split(r'[\s\.\?!]+', text) if word]

    current_stopwords = NLTK_STOPWORDS if NLTK_AVAILABLE and use_nltk_stopwords else FALLBACK_STOPWORDS

    # Remove stopwords for frequency analysis, but keep them for excerpt generation (handled later)
    # For general keywords, remove stopwords
    # For sentence scoring, we might want to keep stopwords initially or use a different list.
    # This version removes stopwords for keyword extraction.

    # For keyword extraction, further remove sentence enders that became part of words
    words_for_keywords = [word for word in words if word not in current_stopwords and word not in ['.','?','!']]

    return words, words_for_keywords # Return both for different uses

def generate_excerpt(full_text, title_text, top_n_keywords, max_chars=250):
    # Use full_text with punctuation for sentence tokenization
    text_for_sentences = full_text.lower()
    text_for_sentences = re.sub(r'\s+', ' ', text_for_sentences).strip() # Normalize whitespace

    if NLTK_AVAILABLE and NLTK_SENT_TOKENIZE:
        sentences = NLTK_SENT_TOKENIZE(text_for_sentences)
    else:
        sentences = re.split(r'(?<=[.!?])\s+', text_for_sentences) # Basic split
        sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return ""

    title_keywords = set(preprocess_text(title_text, use_nltk_stopwords=False)[1]) # Get keywords from title

    sentence_scores = []
    for i, sentence in enumerate(sentences):
        score = 0
        # Tokenize sentence here for scoring
        sentence_words = set(preprocess_text(sentence, use_nltk_stopwords=True)[1])

        for keyword in title_keywords:
            if keyword in sentence_words:
                score += 3 # Higher bonus for title keywords
        for keyword in top_n_keywords:
            if keyword in sentence_words:
                score += 1

        score -= i * 0.1 # Slight penalty for later sentences

        # Bonus for length (up to a point)
        if 50 < len(sentence) < 200 : score += 0.5

        sentence_scores.append((score, sentence))

    sentence_scores.sort(key=lambda x: x[0], reverse=True)

    # Take top 1-3 sentences, ensure it's not too long
    excerpt = ""
    if sentence_scores:
        if len(sentence_scores[0][1]) > max_chars * 0.66: # If the best sentence is already long
             excerpt = sentence_scores[0][1]
        else: # Try to combine first 2-3 sentences
            excerpt = sentence_scores[0][1]
            if len(sentence_scores) > 1 and len(excerpt) + len(sentence_scores[1][1]) + 1 < max_chars:
                excerpt += " " + sentence_scores[1][1]
            if len(sentence_scores) > 2 and len(excerpt) + len(sentence_scores[2][1]) + 1 < max_chars:
                 excerpt += " " + sentence_scores[2][1]

    return excerpt[:max_chars].strip() + "..." if len(excerpt) > max_chars else excerpt.strip()


def extract_keywords_from_style_guide(style_guidance_path):
    keywords = set()
    try:
        with open(style_guidance_path, 'r', encoding='utf-8') as f:
            content = f.read().lower()

        # Look for terms under specific headings, e.g., theme names, EMA principles
        # This regex is basic; could be more sophisticated
        found_sections = re.findall(r'###\s*([A-Za-z0-9\s&_()-]+?)\s*\n([\s\S]*?)(?=###|\Z)', content, re.IGNORECASE)
        # Found sections from theme palletes: [('Digital Sovereignty', '* Primary: Deep Blue...'), ... ]
        for section_tuple in found_sections:
            section_name = section_tuple[0].strip()
            if "theme" in section_name.lower() or "modifier" in section_name.lower(): # If it's a theme/modifier heading
                # The section_name itself is a keyword (e.g. "Digital Sovereignty" theme name)
                keywords.add(section_name.replace("theme","").replace("modifier","").strip())

            # Extract keywords from list items or bolded text within sections
            # This is a simplified heuristic
            list_items = re.findall(r'^\s*[\*\-]\s*(.+)', section_tuple[1], re.MULTILINE)
            for item in list_items:
                # Take first few words of list item if it's descriptive
                # e.g. "*   Primary: Deep Blue (H:210, S:85, L:25)" -> "Primary"
                # or "*   Digital Sovereignty: Design should be clear..." -> "Digital Sovereignty"
                match = re.match(r'([A-Za-z\s]+):', item)
                if match:
                    keywords.add(match.group(1).strip())
                else: # If no colon, maybe it's a direct keyword list
                    # Try to split and take capitalized words or short phrases
                    sub_items = [si.strip() for si in item.split(',') if si.strip()]
                    for si in sub_items:
                        if len(si.split()) <=3 and re.match(r'[A-Z][a-z]+', si): # Simple filter
                             keywords.add(si)

        # Add EMA principles
        ema_principles_match = re.search(r'##\s*1\.\s*Core Aesthetic Philosophy[\s\S]*?###\s*EMA Principles in Visual Design([\s\S]*?)(?=##|\Z)', content, re.IGNORECASE | re.MULTILINE)
        if ema_principles_match:
            ema_content = ema_principles_match.group(1)
            principle_items = re.findall(r'^\s*-\s*\*\*(.*?)\*\*:', ema_content, re.MULTILINE)
            for principle in principle_items:
                keywords.add(principle.strip())

    except Exception: # pylint: disable=broad-except
        # If file not found or regex error, return empty set
        pass
    # Filter out generic terms
    generic_terms = {"name", "primary", "secondary", "accent", "background", "mood", "color shift", "intensity", "particle count", "animation style", "visual complexity"}
    return {kw for kw in keywords if kw and kw not in generic_terms and len(kw) > 3}


def generate_suggestions(metadata_file_path, content_file_path, style_guidance_path):
    suggestions_made = {}
    errors = []
    status_message = ""

    try:
        with open(metadata_file_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except Exception as e: # pylint: disable=broad-except
        errors.append(f"Error loading metadata: {e}")
        return None, {}, "Error loading metadata.", errors

    if metadata.get("jules_override_ai_suggestions") is True:
        status_message = "AI suggestions overridden by 'jules_override_ai_suggestions'."
        return metadata, {}, status_message, errors

    try:
        with open(content_file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except Exception as e: # pylint: disable=broad-except
        errors.append(f"Error loading HTML content: {e}")
        return metadata, {}, "Error loading HTML content.", errors

    plain_text_content = extract_text_from_html(html_content)
    if not plain_text_content.strip():
        errors.append("Extracted text content is empty.")
        return metadata, {}, "Extracted text content is empty.", errors

    # Preprocess for keywords (stopwords removed)
    _, processed_text_keywords = preprocess_text(plain_text_content)

    # Calculate word frequencies
    if NLTK_AVAILABLE and NLTK_FREQ_DIST:
        freq_dist = NLTK_FREQ_DIST(processed_text_keywords)
    else:
        freq_dist = Counter(processed_text_keywords)

    top_keywords_with_freq = freq_dist.most_common(20)
    top_keywords = [kw[0] for kw in top_keywords_with_freq]


    # Excerpt Suggestion
    current_excerpt = metadata.get("excerpt", "")
    if not current_excerpt or len(current_excerpt) < 50: # Threshold to trigger suggestion
        title_text = metadata.get("title", "")
        # Use plain_text_content (not preprocessed) for excerpt generation
        suggested_excerpt = generate_excerpt(plain_text_content, title_text, top_keywords[:10])
        if suggested_excerpt:
            suggestions_made["suggested_excerpt"] = suggested_excerpt

    # Category/Tag Suggestion
    current_category = metadata.get("category", "")
    current_tags = metadata.get("tags", [])
    if not current_category or not current_tags or len(current_tags) < 3:
        style_guide_keywords = extract_keywords_from_style_guide(style_guidance_path)

        suggested_categories = []
        matched_core_concepts = []

        for kw, _ in top_keywords_with_freq[:10]: # Check top 10 article keywords
            for core_kw in style_guide_keywords:
                if kw == core_kw.lower() or kw in core_kw.lower().split(): # Simple match
                    matched_core_concepts.append(core_kw)
                    if core_kw not in suggested_categories and len(suggested_categories) < 2:
                         # Prioritize style guide keywords as categories if they are prominent
                        suggested_categories.append(core_kw)

        # If no direct matches for categories, use top 1-2 broader themes from style guide if possible
        # This part is heuristic; a more robust category mapping would be better.
        if not suggested_categories and style_guide_keywords:
             # Fallback: use a couple of general style guide keywords as categories
            broad_categories = [kw for kw in style_guide_keywords if " " in kw or kw.istitle()] # Prefer multi-word or titled
            suggested_categories = list(broad_categories)[:2]


        suggested_tags = list(set(top_keywords[:5] + matched_core_concepts[:3]))[:7] # Mix of content keywords and matched concepts

        if suggested_categories:
            suggestions_made["suggested_categories"] = list(set(suggested_categories)) # Ensure unique
        if suggested_tags:
            suggestions_made["suggested_tags"] = list(set(suggested_tags)) # Ensure unique

    if suggestions_made:
        if "ai_suggestions" not in metadata:
            metadata["ai_suggestions"] = {}
        metadata["ai_suggestions"].update(suggestions_made)
        status_message = "AI suggestions generated."
    else:
        status_message = "No new AI suggestions generated (existing metadata might be sufficient or content too short)."

    return metadata, suggestions_made, status_message, errors


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({
            "updated_metadata_file_path": None,
            "suggestions_made": {},
            "editorial_ai_message": "Error: Incorrect arguments. Usage: python suggest_metadata.py <metadata_file_path> <content_file_path> <style_guidance_path>",
            "errors": ["Incorrect number of arguments provided."]
        }))
        sys.exit(1)

    meta_path = sys.argv[1]
    content_path = sys.argv[2]
    style_path = sys.argv[3]

    final_metadata, suggestions, message, errors_list = generate_suggestions(meta_path, content_path, style_path)

    if final_metadata and suggestions: # Only write if suggestions were made and added
        try:
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(final_metadata, f, indent=4)
            updated_path = meta_path
            final_message = f"Metadata updated with AI suggestions. {message}"
        except Exception as e: # pylint: disable=broad-except
            updated_path = None
            errors_list.append(f"Error writing updated metadata: {e}")
            final_message = f"AI suggestions generated but failed to write metadata. {message}"
    elif final_metadata and not suggestions and "overridden" not in message: # No new suggestions, but no override
        updated_path = None # No changes to write
        final_message = message # e.g. "No new AI suggestions generated..."
    elif "overridden" in message:
        updated_path = None
        final_message = message
    else: # Likely initial error loading metadata
        updated_path = None
        final_message = message

    print(json.dumps({
        "updated_metadata_file_path": updated_path,
        "suggestions_made": suggestions,
        "editorial_ai_message": final_message,
        "errors": errors_list,
        "nltk_available_in_script": NLTK_AVAILABLE, # For debugging sandbox
        "bs4_available_in_script": BS4_AVAILABLE
    }))
