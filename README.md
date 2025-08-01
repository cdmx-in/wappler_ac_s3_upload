#### Maintained by: Roney Dsilva

## Custom S3 Upload Control
This is a custom S3 upload component designed to give more features to S3 AC module when uploading files. It includes both single file upload and multiple file upload components.

## Components

### 1. Single File Upload (`custom-s3-upload`)
A component for uploading individual files with validation and progress tracking.

### 2. Multiple File Upload (`custom-s3-multi-upload`)
A component for uploading multiple files simultaneously with batch validation and individual file progress tracking.

## S3 Single File Upload Control Properties:
Properties for configuring the behavior and appearance of the single file upload control (`custom-s3-upload`).
  - **ID**: Identifier for the upload control.
  - **Class**: CSS class for styling purposes.
  - **Url**: Wappler API endpoint (POST) having put file from the custom s3 upload.
  - **Input name**: Input name for the input tag and to send as post parameter name for the file, default is `s3_upload`.
  - **Accept**: Allowed file types/extensions for upload.
  - **Validation Url**: Wappler API endpoint to validate file, (Sends the file in request).Leave `blank` if you don't want server-side validation.
  - **Validation Message**: Message displayed when file type validation fails.
  - **File Size Limit**: File size limit in bytes.
  - **Auto Upload**: Option to automatically upload files after selection.
  - **CSV Options**: Additional properties specifically for handling CSV files.
  - **CSV Row Limit**: Maximum number of rows allowed in a CSV file.
  - **CSV Limit Validation**: Validation message displayed when the CSV row limit is exceeded.
  - **CSV No Records Validation**: Validation message displayed when a CSV file has no records.

## S3 Multiple File Upload Control Properties:
Properties for configuring the behavior and appearance of the multiple file upload control (`custom-s3-multi-upload`).

  - **ID**: Identifier for the upload control.
  - **Class**: CSS class for styling purposes.
  - **Url**: Wappler API endpoint (POST) for handling multiple file uploads.
  - **Input name**: Input name for the input tag and to send as post parameter name for the files array. Make sure you append `[]` to the name (default: `s3_upload[]`).
  - **Accept**: Allowed file types/extensions for upload.
  - **Validation Url**: Wappler API endpoint to validate files. Sends all files in one request. Leave blank if you don't want server-side validation. Expects `validatedFiles` in the response from the API, which should be an array of objects with the following structure:

    ```json
    {
      "is_valid": true,
      "message": "Validation message here",
      "fileData": {
        "name": "filename.csv",
        "sha256": "file-sha-value"
      }
    }
    ```
  - **Validation Message**: Message displayed when file type validation fails.
  - **File Size Limit**: Individual file size limit in bytes.
  - **Total Size Limit**: Total combined size limit for all files in bytes (default: 10MB).
  - **Total Files Limit**: Maximum number of files that can be uploaded at once (default: 5).
  - **Auto Upload**: Option to automatically upload files after selection.
  - **CSV Options**: Additional properties specifically for handling CSV files.
  - **CSV Row Limit**: Maximum number of rows allowed in a CSV file.
  - **CSV Limit Validation**: Validation message displayed when the CSV row limit is exceeded.
  - **CSV No Records Validation**: Validation message displayed when a CSV file has no records.

## Actions

### Single File Upload Actions (`custom-s3-upload`)
- **Abort**: Action to abort the upload process.
- **Reset**: Action to reset the upload control.
- **Select**: Action to select a file for upload.
- **Upload**: Action to initiate the file upload process.

### Multiple File Upload Actions (`custom-s3-multi-upload`)
- **Abort**: Action to abort the upload process for all files.
- **Reset**: Action to reset the upload control and clear all selected files.
- **Select**: Action to open file selection dialog for multiple files.
- **Remove File**: Action to remove a specific file from the upload queue by index.
- **Upload**: Action to initiate the upload process for all selected files.

## Data Structure

### Single File Upload Data
The single file upload component provides the following data structure:
- **file**: The selected file object
- **data**: Response data from the server after successful upload
- **dataUrl**: Base64 data URL of the selected file for preview
- **state**: Upload state object with properties:
  - **idle**: Boolean indicating if the component is idle
  - **ready**: Boolean indicating if a file is selected and ready to upload
  - **uploading**: Boolean indicating if upload is in progress
  - **done**: Boolean indicating if upload is complete
- **uploadProgress**: Progress tracking object with properties:
  - **position**: Number of bytes uploaded
  - **total**: Total file size in bytes
  - **percent**: Upload percentage (0-100)

### Multiple File Upload Data
The multiple file upload component provides the following data structure:
- **filesData**: Array of file objects with properties:
  - **name**: File name
  - **size**: File size in bytes
  - **type**: MIME type
  - **dataUrl**: Base64 data URL for preview
- **file_size_limit**: Individual file size limit (number)
- **total_size_limit**: Total files size limit (number)
- **total_files_limit**: Total files limit (number)
- **data**: Response data from the server after successful upload
- **state**: Upload state object (same as single file upload)
- **uploadProgress**: Enhanced progress tracking object with properties:
  - **totalBytes**: Total size of all files in bytes
  - **uploadedBytes**: Number of bytes uploaded across all files
  - **percent**: Overall upload percentage (0-100)
  - **fileProgress**: Array of individual file progress objects

## Events

### Single File Upload Events
- **start**: Fired when upload begins
- **done**: Fired when upload completes (success or failure)
- **error**: Fired when an error occurs
- **invalid**: Fired when file validation fails
- **abort**: Fired when upload is aborted
- **success**: Fired when upload completes successfully
- **upload**: Fired during upload progress (ProgressEvent)

### Multiple File Upload Events
- **start**: Fired when batch upload begins
- **done**: Fired when batch upload completes
- **error**: Fired when an error occurs during upload
- **invalid**: Fired when file validation fails
- **abort**: Fired when upload is aborted
- **success**: Fired when all files upload successfully
- **upload**: Fired during upload progress (ProgressEvent)
- **updated**: Fired when the files list is updated


### CSV Schema Validation

The following JavaScript code snippet defines the schema used for validating CSV files. If using, it needs to be defined on the page or accessible to the page:

```html
<script>
  function isEmailValid(email) {
    // Regular expression to validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  let val_csv_schema = {
      headers: [
        {
          name: 'First Name',
          required: true,
          requiredError: function (headerName, rowNumber, columnNumber) {
            return `${headerName} is required in the ${rowNumber} row / ${columnNumber} column`
          }
        },
        {
          name: 'Last Name',
          required: true,
          requiredError: function (headerName, rowNumber, columnNumber) {
            return `${headerName} is required in the ${rowNumber} row / ${columnNumber} column`
          }
        },
        {
          name: 'Email',
          required: false,
          validate: function (email) {
            return isEmailValid(email)
          },
          validateError: function (headerName, rowNumber, columnNumber) {
            return `${headerName} is not valid in the ${rowNumber} row / ${columnNumber} column`
          }
        }
      ]
    }
</script>
```

## Validation and Error Handling

### Client-Side Validation
Both components perform client-side validation for:
- **File Type**: Validates against the `accept` attribute
- **File Size**: Validates individual files against `file_size_limit`
- **Total Size** (Multi-upload only): Validates combined size against `total_size_limit`
- **File Count** (Multi-upload only): Validates number of files against `total_files_limit`
- **CSV Content**: Validates CSV structure and row limits for CSV files

### Server-Side Validation
If `val_url` is provided, files are sent to the server for additional validation before upload.

### Error Messages
Validation error messages are displayed in an element with ID `{component-id}-val-msg`. For example, if your component has ID "myUpload", create a div with ID "myUpload-val-msg" to display validation messages.

```html
<div id="myUpload-val-msg" style="display: none;"></div>
<dmx-custom-s3-upload id="myUpload" ...></dmx-custom-s3-upload>
```

### API Response Format
The server should return JSON responses in the following format:

## Features Comparison

| Feature | Single Upload | Multi Upload |
|---------|---------------|--------------|
| File Selection | Single file | Multiple files |
| Drag & Drop | ✓ | ✓ |
| Progress Tracking | Individual file | Batch |
| File Validation | ✓ | ✓ |
| CSV Validation | ✓ | ✓ |
| File Size Limits | Individual only | total |
| File Count Limits | N/A | ✓ |
| Remove Files | Reset only | Individual removal |
| Auto Upload | ✓ | ✓ |
| Server Validation | ✓ | ✓ |

## Best Practices

1. **Always provide validation message elements** with the correct ID pattern (`{component-id}-val-msg`)
2. **Set appropriate file size limits** based on your server configuration
3. **Use server-side validation** for critical file validation logic
4. **Handle events properly** to provide user feedback during upload
5. **Test with various file types** to ensure accept patterns work correctly
6. **For multi-upload, consider UX** when setting file count and size limits

## Browser Compatibility
- Modern browsers supporting HTML5 File API
- Drag and drop functionality requires modern browser support
- FileReader API support required for file previews
