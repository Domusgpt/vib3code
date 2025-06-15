import json
import os
import sys
import shutil

def process_document_assets(staging_batch_dir_name, base_filename, txt_asset_fields_json_str, pdf_asset_fields_json_str):
    # 1. Construct Paths
    metadata_file_path = f"/app/content_pipeline/staging/{staging_batch_dir_name}/{base_filename}_metadata.json"
    incoming_batch_base_path = f"/app/content_pipeline/incoming/{staging_batch_dir_name}"
    processed_assets_article_documents_path = f"/app/content_pipeline/processed_assets/documents/{base_filename}" # For PDFs

    # 2. Initialization
    processed_files_log = [] # Generic log for both TXT and PDF
    error_log = []
    ai_message = ""
    updated_metadata_file_path = None
    metadata_updated = False

    txt_asset_fields = []
    pdf_asset_fields = []

    try:
        txt_asset_fields = json.loads(txt_asset_fields_json_str)
        pdf_asset_fields = json.loads(pdf_asset_fields_json_str)
    except json.JSONDecodeError as e:
        error_log.append(f"Error parsing asset_fields_json: {e}")
        print(json.dumps({
            "processed_files_log": processed_files_log,
            "error_log": error_log,
            "editorial_ai_message": "Error: Could not parse TXT or PDF asset fields JSON.",
            "updated_metadata_file_path": None
        }))
        return

    os.makedirs(processed_assets_article_documents_path, exist_ok=True) # For PDFs

    # DEBUG: Check if directory was created (for PDF destination)
    if not os.path.isdir(processed_assets_article_documents_path):
        error_log.append(f"CRITICAL: PDF documents directory {processed_assets_article_documents_path} was NOT created or is not a directory.")
    else:
        error_log.append(f"DEBUG: PDF documents directory {processed_assets_article_documents_path} successfully created or already exists.")

    # 3. Read Article Metadata
    try:
        with open(metadata_file_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except FileNotFoundError:
        error_log.append(f"Metadata file not found: {metadata_file_path}")
        ai_message = f"Error processing document assets for '{base_filename}': Metadata file not found."
        print(json.dumps({"processed_files_log": processed_files_log, "error_log": error_log, "editorial_ai_message": ai_message, "updated_metadata_file_path": None}))
        return
    except json.JSONDecodeError as e:
        error_log.append(f"Error decoding metadata JSON from {metadata_file_path}: {e}")
        ai_message = f"Error processing document assets for '{base_filename}': Could not decode metadata."
        print(json.dumps({"processed_files_log": processed_files_log, "error_log": error_log, "editorial_ai_message": ai_message, "updated_metadata_file_path": None}))
        return

    # 4. Process Asset Fields
    successful_txt_reads = 0
    failed_txt_reads = 0
    successful_pdf_copies = 0
    failed_pdf_copies = 0

    # Process TXT fields
    for field_name in txt_asset_fields:
        if field_name in metadata and isinstance(metadata[field_name], str) and metadata[field_name].strip():
            relative_path = metadata[field_name]
            clean_relative_path = relative_path.lstrip('/')
            source_txt_path = os.path.normpath(os.path.join(incoming_batch_base_path, clean_relative_path))

            content_field_name = field_name + "_content"
            status_field_name = field_name + "_status"

            try:
                if not os.path.exists(source_txt_path):
                    raise FileNotFoundError(f"Source TXT file not found: {source_txt_path}")

                with open(source_txt_path, 'r', encoding='utf-8') as txt_file:
                    file_content = txt_file.read()

                metadata[content_field_name] = file_content
                metadata[status_field_name] = "processed"
                processed_files_log.append({"source": source_txt_path, "field_updated": content_field_name, "status": "success_read_embedded"})
                successful_txt_reads += 1
                metadata_updated = True
            except Exception as e:
                metadata[status_field_name] = "error_reading"
                error_log.append(f"Error reading TXT file '{source_txt_path}' for field '{field_name}': {e}")
                processed_files_log.append({"source": source_txt_path, "field": field_name, "status": "error_reading", "error": str(e)})
                failed_txt_reads += 1
                metadata_updated = True # Metadata updated with error status
        elif field_name in metadata: # Field exists but is empty or not a string
             metadata[field_name + "_status"] = "skipped_invalid_path"
             metadata_updated = True


    # Process PDF fields (similar to image/audio asset processing)
    for field_name in pdf_asset_fields:
        if field_name in metadata and isinstance(metadata[field_name], str) and metadata[field_name].strip():
            relative_path = metadata[field_name]

            if relative_path.startswith('/content_pipeline/processed_assets/'): # Already processed
                # If needed, add to log, but essentially skip re-processing
                # processed_files_log.append({"source": relative_path, "status": "skipped_already_processed"})
                continue

            clean_relative_path = relative_path.lstrip('/')
            source_pdf_path = os.path.normpath(os.path.join(incoming_batch_base_path, clean_relative_path))
            pdf_filename = os.path.basename(clean_relative_path)
            destination_pdf_path = os.path.join(processed_assets_article_documents_path, pdf_filename)
            new_metadata_path = f"/content_pipeline/processed_assets/documents/{base_filename}/{pdf_filename}"

            try:
                if not os.path.exists(source_pdf_path):
                    raise FileNotFoundError(f"Source PDF file not found: {source_pdf_path}")

                shutil.copy2(source_pdf_path, destination_pdf_path)
                metadata[field_name] = new_metadata_path # Update path in metadata
                processed_files_log.append({"source": source_pdf_path, "staged_at": new_metadata_path, "status": "success_copied"})
                successful_pdf_copies += 1
                metadata_updated = True
            except Exception as e:
                error_log.append(f"Error copying PDF '{source_pdf_path}' to '{destination_pdf_path}': {e}")
                processed_files_log.append({"source": source_pdf_path, "original_path_in_metadata": relative_path, "status": "error_copying", "error": str(e)})
                failed_pdf_copies += 1
                # Do not update metadata[field_name] if copy failed, keep original path


    # 5. Save Updated Metadata
    if metadata_updated:
        try:
            def json_serial(obj): # Copied from previous script
                from datetime import date, datetime
                if isinstance(obj, (datetime, date)): return obj.isoformat()
                raise TypeError(f"Type {type(obj)} not serializable")
            with open(metadata_file_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=4, default=json_serial)
            updated_metadata_file_path = metadata_file_path
        except Exception as e:
            error_log.append(f"Error writing updated metadata to {metadata_file_path}: {e}")

    # 6. Prepare EditorialAI Message
    article_title = metadata.get('title', base_filename)
    messages = []
    if successful_txt_reads > 0 : messages.append(f"{successful_txt_reads} TXT file(s) embedded")
    if failed_txt_reads > 0 : messages.append(f"{failed_txt_reads} TXT file(s) failed to read")
    if successful_pdf_copies > 0 : messages.append(f"{successful_pdf_copies} PDF file(s) copied")
    if failed_pdf_copies > 0 : messages.append(f"{failed_pdf_copies} PDF file(s) failed to copy")

    if not messages:
        ai_message = f"No new document assets processed for article '{article_title}'."
    else:
        ai_message = f"Document asset processing for '{article_title}': {', '.join(messages)}. Check logs."

    # 7. Return Results
    print(json.dumps({
        "processed_files_log": processed_files_log,
        "error_log": error_log,
        "editorial_ai_message": ai_message,
        "updated_metadata_file_path": updated_metadata_file_path,
        "metadata_after_processing": metadata
    }))

if __name__ == "__main__":
    if len(sys.argv) != 5: # Expect 4 arguments now + script name
        print(json.dumps({
            "processed_files_log": [],
            "error_log": ["Usage: python process_document_assets.py <staging_batch_dir_name> <base_filename> <txt_asset_fields_json> <pdf_asset_fields_json>"],
            "editorial_ai_message": "Error: Incorrect arguments for process_document_assets.py.",
            "updated_metadata_file_path": None
        }))
        sys.exit(1)

    staging_batch_dir_name_arg = sys.argv[1]
    base_filename_arg = sys.argv[2]
    txt_asset_fields_json_str_arg = sys.argv[3]
    pdf_asset_fields_json_str_arg = sys.argv[4]

    process_document_assets(staging_batch_dir_name_arg, base_filename_arg, txt_asset_fields_json_str_arg, pdf_asset_fields_json_str_arg)
