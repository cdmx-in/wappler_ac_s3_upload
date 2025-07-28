// Base action for single file upload
dmx.Actions({
    "s3.custom-s3-upload": function (t) {
        var e = this.parse(t.input),
            i = this.parse(t.url),
            s = document.getElementById(e).files[0];
        return new Promise((function (t, e) {
            var n = new XMLHttpRequest;
            n.onerror = e, n.onabort = e, n.ontimeout = e, n.onload = t, n.open("PUT", i), n.setRequestHeader("Content-Type", s.type), n.send(s)
        }))
    }
}),
    dmx.Component("custom-s3-upload", {
        initialData: {
            data: null,
            file: null,
            state: {
                idle: !0,
                ready: !1,
                uploading: !1,
                done: !1
            },
            uploadProgress: {
                position: 0,
                total: 0,
                percent: 0
            },
            valApiResp: {
                status: 0,
                message: "",
                response: null
            },
            lastError: {
                status: 0,
                message: "",
                response: null
            }
        },
        attributes: {
            id: {
                type: String,
            },
            url: {
                type: String,
                default: null
            },
            val_url: {
                type: String,
                default: null
            },
            input_name: {
                type: String,
                default: "s3_upload"
            },
            include_file_data_upload: {
                type: Boolean,
                default: !1
            },
            prop: {
                type: String,
                default: "url"
            },
            accept: {
                type: String,
                default: null
            },
            accept_val_msg: {
                type: String,
                default: "Invalid file type."
            },
            file_size_limit: {
                type: Number,
                default: 2097152
            },
            autoupload: {
                type: Boolean,
                default: !1
            },
            csv_row_limit: {
                type: Number,
                default: 10
            },
            csv_no_records_val_msg: {
                type: String,
                default: "CSV has no records."
            },
            csv_limit_val_msg: {
                type: String,
                default: "CSV file exceeds row limit. Allowed limit 10"
            },
            val_resp_msg: {
                type: String,
                default: "Validation failed."
            },
            val_api_params: {
                type: Array,
                default: []
            },
            api_params: {
                type: Array,
                default: []
            },
        },
        methods: {
            abort() {
                this.xhr.abort();
            },
            reset() {
                this.abort();
                this._reset();
            },
            select() {
                this.input.click();
            },
            upload() {
                if (this.file) {
                    this._upload();
                } else {
                    console.warn("No file to upload");
                }
            }
        },

        events: {
            start: Event,
            done: Event,
            error: Event,
            invalid: Event,
            abort: Event,
            success: Event,
            upload: ProgressEvent
        },
        render(t) {
            this.$node.addEventListener("dragover",
                this.dragoverHandler),
                this.$node.addEventListener("drop", this.dropHandler),
                this.$node.addEventListener("click", this.clickHandler),
                this.input = document.createElement("input"),
                this.input.type = "file",
                this.input.accept = this.props.accept || "*/*",
                this.input.style.display = "none",
                this.input.addEventListener("change",
                    this.changeHandler),
                document
                    .getElementById(`${this.$node.id}`)
                    .appendChild(this.input)
            this.$parse()
        },
        init() {
            this.abortHandler = this.abortHandler.bind(this),
                this.errorHandler = this.errorHandler.bind(this),
                this.timeoutHandler = this.timeoutHandler.bind(this),
                this.loadHandler = this.loadHandler.bind(this),
                this.progressHandler = this.progressHandler.bind(this),
                this.dragoverHandler = this.dragoverHandler.bind(this),
                this.dropHandler = this.dropHandler.bind(this),
                this.clickHandler = this.clickHandler.bind(this),
                this.changeHandler = this.changeHandler.bind(this),
                this.xhr = new XMLHttpRequest,
                this.xhr.addEventListener("abort", this.abortHandler),
                this.xhr.addEventListener("error", this.errorHandler),
                this.xhr.addEventListener("timeout", this.timeoutHandler),
                this.xhr.addEventListener("load", this.loadHandler),
                this.xhr.upload.addEventListener("progress",
                    this.progressHandler)
        },
        performUpdate(t) {
            t.has("accept") && (this.input.accept = this.props.accept || "*/*")
        },
        destroy() {
            this.xhr.removeEventListener("abort", this.abortHandler),
                this.xhr.removeEventListener("error", this.errorHandler),
                this.xhr.removeEventListener("timeout", this.timeoutHandler),
                this.xhr.removeEventListener("load", this.loadHandler),
                this.xhr.upload.removeEventListener("progress", this.progressHandler),
                this.$node.removeEventListener("dragover", this.dragoverHandler),
                this.$node.removeEventListener("drop", this.dropHandler),
                this.$node.removeEventListener("click", this.clickHandler),
                this.input.removeEventListener("change", this.changeHandler),
                this.xhr = null,
                this.input = null
        },
        validate: function (t, context) {
            return new Promise((resolve, reject) => {
                if (!context.props.val_url) {
                    resolve(true);
                    return;
                }
                var valElement = document.getElementById(`${this.props.id}-val-msg`);
                var validationMessage = "";
                const fileSizeLimit = context.props.file_size_limit;
                updateValidationMessage(validationMessage);
                // Check file size

                if (context.props.accept) {
                    validationMessage = validateMimeType(t, context);
                    if (validationMessage !== "") {
                        context.set({
                            data: null,
                            state: {
                                idle: !0,
                                ready: !1,
                                uploading: !1,
                                done: !1
                            },
                            uploadProgress: {
                                position: 0,
                                total: 0,
                                percent: 0
                            },
                            lastError: {
                                status: 0,
                                message: "invalid_file_type",
                                response: null
                            }
                        });
                        context.dispatchEvent("error");
                        updateValidationMessage(validationMessage);
                        return resolve(false);
                    }
                }
                if (t.size > fileSizeLimit) {
                    validationMessage = `File size exceeds the limit of ${(fileSizeLimit / (1024 * 1024)).toFixed(2)}MB.`;
                    context.set({
                        data: null,
                        state: {
                            idle: !0,
                            ready: !1,
                            uploading: !1,
                            done: !1
                        },
                        uploadProgress: {
                            position: 0,
                            total: 0,
                            percent: 0
                        },
                        lastError: {
                            status: 0,
                            message: "file_size_exceeded",
                            response: null
                        }
                    });
                    updateValidationMessage(validationMessage);
                    return resolve(false);
                }

                let xhr = new XMLHttpRequest();
                let formData = new FormData();
                formData.append(context.props.input_name, context.file);
                // Append additional parameters from this.props.val_api_params to formData
                this.props.val_api_params.forEach(function (param) {
                    formData.append(param.key, param.value);
                });
                xhr.onabort = context.abortHandler;
                xhr.onerror = context.errorHandler;
                xhr.open("POST", context.props.val_url);
                xhr.onload = function () {
                    let response = xhr.responseText;
                    let parsedResponse = null;

                    try {
                        parsedResponse = JSON.parse(response);
                    } catch (e) {
                        console.error("Failed to parse validation response:", e);
                        parsedResponse = null;
                    }

                    context.set({
                        valApiResp: {
                            status: xhr.status,
                            message: response,
                            response: parsedResponse
                        }
                    })
                    if (xhr.status < 200 || xhr.status >= 300) {
                        context.set({
                            data: null,
                            state: {
                                idle: !0,
                                ready: !1,
                                uploading: !1,
                                done: !1
                            },
                            uploadProgress: {
                                position: 0,
                                total: 0,
                                percent: 0
                            },
                            lastError: {
                                status: xhr.status,
                                message: response,
                                response: parsedResponse
                            }
                        });
                        dmx.nextTick(function () {
                            if (xhr.status === 400) {
                                this.dispatchEvent("invalid");
                            } else {
                                this.dispatchEvent("error");
                            }
                            validationMessage = context.props.val_resp_msg.replace(/^"(.*)"$/, '$1');
                            updateValidationMessage(validationMessage);
                        }, context);
                        return resolve(false);
                    }
                    else {
                        if (t.type.toLowerCase() === 'text/csv') {
                            var reader = new FileReader();
                            reader.onload = function (event) {
                                var content = event.target.result.trim();
                                // Check if the file is empty
                                if (content.length === 0) {
                                    validationMessage = "CSV file is empty.";
                                    context.set({
                                        data: null,
                                        state: {
                                            idle: !0,
                                            ready: !1,
                                            uploading: !1,
                                            done: !1
                                        },
                                        uploadProgress: {
                                            position: 0,
                                            total: 0,
                                            percent: 0
                                        },
                                        lastError: {
                                            status: 0,
                                            message: "",
                                            response: null
                                        }
                                    });
                                    updateValidationMessage(validationMessage);
                                    resolve(false);
                                    return;
                                }
                                var rows = content.split('\n').map(row => row.trim());
                                var numRows = rows.length - 1; // Subtract header
                                if (numRows < 1) {
                                    validationMessage = context.props.csv_no_records_val_msg;
                                    context.set({
                                        data: null,
                                        state: {
                                            idle: !0,
                                            ready: !1,
                                            uploading: !1,
                                            done: !1
                                        },
                                        uploadProgress: {
                                            position: 0,
                                            total: 0,
                                            percent: 0
                                        },
                                        lastError: {
                                            status: 0,
                                            message: "",
                                            response: null
                                        }
                                    });
                                    updateValidationMessage(validationMessage);
                                    resolve(false);
                                    return;
                                }
                                if (numRows > context.props.csv_row_limit) {
                                    validationMessage = context.props.csv_limit_val_msg;
                                    context.set({
                                        data: null,
                                        state: {
                                            idle: !0,
                                            ready: !1,
                                            uploading: !1,
                                            done: !1
                                        },
                                        uploadProgress: {
                                            position: 0,
                                            total: 0,
                                            percent: 0
                                        },
                                        lastError: {
                                            status: 0,
                                            message: "",
                                            response: null
                                        }
                                    });
                                    dmx.nextTick(function () {
                                        updateValidationMessage(validationMessage);
                                        resolve(false);
                                    }, context);
                                    return;
                                }
                                let headers = rows[0].split(',');
                                if (headers.length === 0) {
                                    validationMessage = "CSV file is missing a header row.";
                                    context.set({
                                        data: null,
                                        state: {
                                            idle: !0,
                                            ready: !1,
                                            uploading: !1,
                                            done: !1
                                        },
                                        uploadProgress: {
                                            position: 0,
                                            total: 0,
                                            percent: 0
                                        },
                                        lastError: {
                                            status: 0,
                                            message: "",
                                            response: null
                                        }
                                    });
                                    updateValidationMessage(validationMessage);
                                    resolve(false);
                                    return;
                                }
                                let headerLength = headers.length;
                                let invalidRecordMessages = [];
                                let jsonData = [];
                                for (let i = 1; i < rows.length; i++) {
                                    if (rows[i].length > 0) {
                                        let data = rows[i].split(',');
                                        // Check for mismatched quotes
                                        let quotesCount = (rows[i].match(/"/g) || []).length;
                                        if (quotesCount % 2 !== 0) {
                                            invalidRecordMessages.push(`Mismatched quotes on line ${i + 1}`);
                                        }
                                        // Check for invalid record length
                                        if (data.length !== headerLength) {
                                            invalidRecordMessages.push(`Invalid Record Length: columns length is ${headerLength}, got ${data.length} on line ${i + 1}`);
                                        }
                                        // Check for invalid characters
                                        if (/[^\x00-\x7F]+/.test(rows[i])) {
                                            invalidRecordMessages.push(`Invalid characters found on line ${i + 1}`);
                                        }

                                        let entry = {};
                                        for (let j = 0; j < headers.length; j++) {
                                            entry[headers[j]] = data[j];
                                        }
                                        // Schema validation
                                        let invalidRecords = {};
                                        if (typeof val_csv_schema !== 'undefined' && val_csv_schema?.headers) {
                                            val_csv_schema.headers.forEach((headerConfig, index) => {
                                                try {
                                                    let value = entry[headerConfig.name];
                                                    let isConditionMet = headerConfig.condition ? headerConfig.condition(entry) : true;
                                                    if (headerConfig.required && isConditionMet && (!value || value.trim() === '')) {
                                                        const errorMessage = headerConfig.requiredError(headerConfig.name, i + 1, index + 1);
                                                        if (!invalidRecords[i + 1]) {
                                                            invalidRecords[i + 1] = [];
                                                        }
                                                        invalidRecords[i + 1].push(`C${index + 1} [${errorMessage}]`);
                                                    }
                                                    if (value) {
                                                        if (headerConfig.validate && !headerConfig.validate(value)) {
                                                            const errorMessage = headerConfig.validateError(headerConfig.name, i + 1, index + 1);
                                                            if (!invalidRecords[i + 1]) {
                                                                invalidRecords[i + 1] = [];
                                                            }
                                                            invalidRecords[i + 1].push(`C${index + 1} [${errorMessage}]`);
                                                        }
                                                        if (headerConfig.dependentValidate && !headerConfig.dependentValidate(value, entry)) {
                                                            const errorMessage = headerConfig.validateError(headerConfig.name, i + 1, index + 1);
                                                            if (!invalidRecords[i + 1]) {
                                                                invalidRecords[i + 1] = [];
                                                            }
                                                            invalidRecords[i + 1].push(`C${index + 1} [${errorMessage}]`);
                                                        }
                                                    }
                                                } catch (validationError) {
                                                    console.error("Schema validation error:", validationError);
                                                    if (!invalidRecords[i + 1]) {
                                                        invalidRecords[i + 1] = [];
                                                    }
                                                    invalidRecords[i + 1].push(`C${index + 1} [Validation function error]`);
                                                }
                                            });
                                        }
                                        // Output the errors in row-wise format
                                        Object.keys(invalidRecords).forEach(rowNumber => {
                                            invalidRecordMessages.push(`Row ${rowNumber}: ${invalidRecords[rowNumber].join(', ')}`);
                                        });
                                        jsonData.push(entry);
                                    } else {
                                        invalidRecordMessages.push(`Empty row found on line ${i + 1}`);
                                        break;
                                    }
                                }
                                invalidRecordMessage = invalidRecordMessages.join('\n\n');
                                if (invalidRecordMessage) {
                                    context.set({
                                        data: null,
                                        state: {
                                            idle: !0,
                                            ready: !1,
                                            uploading: !1,
                                            done: !1
                                        },
                                        uploadProgress: {
                                            position: 0,
                                            total: 0,
                                            percent: 0
                                        },
                                        lastError: {
                                            status: 0,
                                            message: "",
                                            response: null
                                        }
                                    });
                                    updateValidationMessage(invalidRecordMessage);
                                    resolve(false);
                                } else {
                                    context.set({
                                        data: {
                                            output: jsonData
                                        }
                                    });
                                    updateValidationMessage();
                                    resolve(true);
                                }
                            };
                            reader.onerror = function (error) {
                                console.error("Error reading CSV file:", error);
                                validationMessage = "Error reading CSV file.";
                                context.set({
                                    data: null,
                                    dataUrl: null,
                                    state: {
                                        idle: !0,
                                        ready: !1,
                                        uploading: !1,
                                        done: !1
                                    },
                                    uploadProgress: {
                                        position: 0,
                                        total: 0,
                                        percent: 0
                                    },
                                    lastError: {
                                        status: 0,
                                        message: "file_read_error",
                                        response: null
                                    }
                                });
                                updateValidationMessage(validationMessage);
                                resolve(false);
                            };
                            reader.readAsText(t);
                        }
                        else {
                            resolve(true);
                        }
                    }
                };

                xhr.send(formData);

                function validateMimeType(t, context) {
                    var acceptTypes = context.props.accept.split(/\s*,\s*/g);
                    for (var i = 0; i < acceptTypes.length; i++) {
                        var e = acceptTypes[i];
                        if ("." == e.charAt(0)) {
                            if (t.name.match(new RegExp("\\" + e + "$", "i"))) return "";
                        } else if (/(audio|video|image)\/\*/i.test(e)) {
                            if (t.type.match(new RegExp("^" + e.replace(/\*/g, ".*") + "$", "i"))) return "";
                        } else if (t.type.toLowerCase() == e.toLowerCase()) {
                            return "";
                        }
                    }
                    return context.props.accept_val_msg;
                }

                function updateValidationMessage(message) {
                    if (valElement) {
                        if (message) {
                            valElement.innerText = message;
                            valElement.style.color = "red";
                            valElement.style.display = "block";
                        } else {
                            valElement.innerText = "";
                            valElement.style.display = "none";
                        }
                    } else {
                        console.warn("Validation message element not found");
                    }
                }
            });
        },
        updateFile(t) {
            dmx.nextTick(async function () {
                this.file = t, this.set({
                    file: t,
                    state: {
                        idle: !1,
                        ready: !0,
                        uploading: !1,
                        done: !1
                    }
                });
                // Validate and upload
                if (!(await this.validate(t, this))) {
                    // Clear any existing dataUrl on validation failure
                    this.set({
                        dataUrl: null
                    });
                    return;
                }
                const reader = new FileReader();
                reader.addEventListener(
                    "load",
                    () => {
                        // Store dataUrl in component state instead of modifying the file object
                        this.set({
                            dataUrl: reader.result
                        });
                    },
                    false,
                );
                reader.readAsDataURL(t);
                if (this.props.autoupload) {
                    this._upload();
                }
            }, this);
        },
        abort: function () {
            this.xhr.abort()
        },
        _reset() {
            this.file = null;
            this.set({
                data: null,
                file: null,
                dataUrl: null,
                valApiResp: {
                    status: 0,
                    message: "",
                    response: null
                },
                state: {
                    idle: !0,
                    ready: !1,
                    uploading: !1,
                    done: !1
                },
                uploadProgress: {
                    position: 0,
                    total: 0,
                    percent: 0
                },
                lastError: {
                    status: 0,
                    message: "",
                    response: null
                }
            })
        },
        _upload() {
            if (!this.props.url) {
                return void this.errorHandler("No url attribute is set");
            }
            this.set({
                state: {
                    idle: !1,
                    ready: !1,
                    uploading: !0,
                    done: !1
                }
            }), this.dispatchEvent("start");

            const file = this.file;

            if (file) {
                try {
                    const formData = new FormData();
                    // Always include the file data with the specified input name
                    formData.append(this.props.input_name, file);

                    // Include any additional parameters if needed
                    if (this.props.include_file_data_upload) {
                        formData.append("input_name", this.props.input_name);
                    }
                    this.props.api_params.forEach(function (param) {
                        formData.append(param.key, param.value);
                    });
                    this.xhr.open("POST", this.props.url);

                    this.xhr.send(formData);
                } catch (t) {
                    this.errorHandler(t)
                }
            } else {
                console.log('No file selected.');
                this.set({
                    state: {
                        idle: !0,
                        ready: !1,
                        uploading: !1,
                        done: !1
                    }
                });
                return void this.onError("No file selected");
            }
        },
        abortHandler(t) {
            this.set({
                data: null,
                state: {
                    idle: !1,
                    ready: !0,
                    uploading: !1,
                    done: !1
                },
                uploadProgress: {
                    position: 0,
                    total: 0,
                    percent: 0
                }
            }), this.dispatchEvent("abort"),
                this.dispatchEvent("done")
        },
        errorHandler(t) {
            this.set({
                data: null,
                dataUrl: null,
                state: {
                    idle: !0,
                    ready: !1,
                    uploading: !1,
                    done: !1
                },
                uploadProgress: {
                    position: 0,
                    total: 0,
                    percent: 0
                },
                lastError: {
                    status: t.status,
                    message: "",
                    response: JSON.parse(t.responseText)
                }
            });
            this.dispatchEvent("error")
            if (t.status === 400) {
                jsonResponse = JSON.parse(t.responseText);
                valElement.innerText = jsonResponse.data.file;
                valElement.style.color = "red";
                valElement.style.display = "block";
            }
            this.dispatchEvent("done")
            return
        },
        timeoutHandler(t) {
            this.errorHandler("Execution timeout")
        },
        loadHandler(t) {
            if (this.xhr.status >= 400) {
                this.errorHandler(this.xhr);
            } else {
                try {
                    const responseData = JSON.parse(this.xhr.responseText);
                    this.set({
                        state: {
                            idle: !1,
                            ready: !1,
                            uploading: !1,
                            done: !0
                        },
                        uploadProgress: {
                            position: this.file.size,
                            total: this.file.size,
                            percent: 100
                        },
                        data: responseData
                    });
                    this.dispatchEvent("success");
                    this.dispatchEvent("done");
                } catch (parseError) {
                    console.error("Error parsing upload response:", parseError);
                    this.errorHandler("Invalid response format from server");
                }
            }
        },
        progressHandler(t) {
            this.set({
                state: {
                    idle: !1,
                    ready: !1,
                    uploading: !0,
                    done: !1
                },
                uploadProgress: {
                    position: t.loaded,
                    total: this.file.size,
                    percent: Math.ceil(t.loaded / t.total * 100)
                }
            }), this.dispatchEvent("upload", {
                lengthComputable: t.lengthComputable,
                loaded: t.loaded,
                total: t.total
            })
        },
        dragoverHandler(t) {
            t.stopPropagation(),
                t.preventDefault(),
                t.dataTransfer.dropEffect = 1 == t.dataTransfer.items.length ? "copy" : "none"
        },
        dropHandler(t) {
            t.stopPropagation(),
                t.preventDefault(), 1 == t.dataTransfer.files.length && this.updateFile(t.dataTransfer.files[0])
        },
        clickHandler(t) {
            this.input.click()
        },
        changeHandler(t) {
            this.updateFile(t.target.files[0]),
                this.input.value = "",
                this.input.type = "",
                this.input.type = "file";
        }
    });

// Multi file upload component starts here
// Multi-file upload component
dmx.Actions({
    "s3.custom-s3-multi-upload": function (t) {
        var e = this.parse(t.input),
            i = this.parse(t.url),
            files = document.getElementById(e).files;

        return new Promise((function (t, e) {
            var n = new XMLHttpRequest;
            n.onerror = e;
            n.onabort = e;
            n.ontimeout = e;
            n.onload = t;
            n.open("POST", i);

            var formData = new FormData();
            Array.from(files).forEach((file, index) => {
                formData.append(`${this.props?.input_name || 's3_upload[]'}`, file);
            });

            n.send(formData);
        }));
    }
}),
    dmx.Component("custom-s3-multi-upload", {
        initialData: {
            data: null,
            filesData: [],
            file_size_limit: 2097152,
            total_size_limit: 10485760,
            total_files_limit: 5,
            state: {
                idle: !0,
                ready: !1,
                uploading: !1,
                done: !1
            },
            uploadProgress: {
                position: 0,
                total: 0,
                percent: 0,
                fileProgress: []
            },
            valApiResp: {
                status: 0,
                message: "",
                response: null
            },
            lastError: {
                status: 0,
                message: "",
                response: null
            }
        },

        attributes: {
            id: {
                type: String
            },
            url: {
                type: String,
                default: null
            },
            val_url: {
                type: String,
                default: null
            },
            input_name: {
                type: String,
                default: "s3_upload[]"
            },
            include_file_data_upload: {
                type: Boolean,
                default: false
            },
            prop: {
                type: String,
                default: "url"
            },
            accept: {
                type: String,
                default: null
            },
            accept_val_msg: {
                type: String,
                default: "Invalid file type."
            },
            file_size_limit: {
                type: Number,
                default: 2097152
            },
            total_size_limit: {
                type: Number,
                default: 10485760
            },
            total_files_limit: {
                type: Number,
                default: 5
            },
            autoupload: {
                type: Boolean,
                default: false
            },
            csv_row_limit: {
                type: Number,
                default: 10
            },
            csv_no_records_val_msg: {
                type: String,
                default: "CSV has no records."
            },
            csv_limit_val_msg: {
                type: String,
                default: "CSV file exceeds row limit. Allowed limit 10"
            },
            val_resp_msg: {
                type: String,
                default: "Validation failed."
            },
            val_api_params: {
                type: Array,
                default: []
            },
            api_params: {
                type: Array,
                default: []
            }
        },

        methods: {
            abort() {
                if (this.xhr) {
                    this.xhr.abort();
                }
            },
            reset() {
                this.abort();
                this._reset();
            },
            select() {
                this.input.click();
            },
            async removeFile(index) {
                if (index >= 0 && index < this.files.length) {
                    const updatedFilesArray = Array.from(this.files).filter((_, i) => i !== index);

                    // Create a new DataTransfer object to hold the updated files
                    const dataTransfer = new DataTransfer();
                    updatedFilesArray.forEach(file => dataTransfer.items.add(file));

                    // Assign the new FileList back to this.files
                    this.files = dataTransfer.files;

                    this._filesData = await Promise.all(
                        Array.from(this.files).map(async (file) => {
                            const dataUrl = await new Promise(resolve => {
                                const reader = new FileReader();
                                reader.onload = () => resolve(reader.result);
                                reader.readAsDataURL(file);
                            });
                            return {
                                name: file.name,
                                size: file.size.toFixed(),
                                type: file.type,
                                dataUrl: dataUrl
                            };
                        })
                    );
                    this._updateFilesList();
                }
            },
            upload() {
                if (this.files.length > 0) {
                    this._uploadFiles();
                } else {
                    console.warn("No files to upload");
                }
            }
        },

        events: {
            start: Event,
            done: Event,
            error: Event,
            invalid: Event,
            abort: Event,
            success: Event,
            upload: ProgressEvent,
            updated: Event
        },

        render(t) {
            // Setup drag and drop handlers
            this.$node.addEventListener("dragover", this.dragoverHandler);
            this.$node.addEventListener("drop", this.dropHandler);
            this.$node.addEventListener("click", this.clickHandler);

            // Setup file input
            this.input = document.createElement("input");
            this.input.type = "file";
            this.input.multiple = true;
            this.input.accept = this.props.accept || "*/*";
            this.input.style.display = "none";
            this.input.addEventListener("change", this.changeHandler);
            document.getElementById(`${this.$node.id}`).appendChild(this.input);
            this.$parse();
        },

        init() {
            this.timeoutHandler = this.timeoutHandler.bind(this);
            this.dragoverHandler = this.dragoverHandler.bind(this);
            this.dropHandler = this.dropHandler.bind(this);
            this.clickHandler = this.clickHandler.bind(this);
            this.changeHandler = this.changeHandler.bind(this);
            this.abortHandler = this.abortHandler.bind(this);
            this.errorHandler = this.errorHandler.bind(this);
            this.loadHandler = this.loadHandler.bind(this);
            this.progressHandler = this.progressHandler.bind(this);

            this.xhr = new XMLHttpRequest();
            this.xhr.addEventListener("abort", this.abortHandler),
                this.xhr.addEventListener("error", this.errorHandler),
                this.xhr.addEventListener("timeout", this.timeoutHandler),
                this.xhr.addEventListener("load", this.loadHandler),
                this.xhr.upload.addEventListener("progress",
                    this.progressHandler)

            this.files = [];
            this._filesData = [];
            this.set({
                file_size_limit: this.props.file_size_limit,
                total_size_limit: this.props.total_size_limit,
                total_files_limit: this.props.total_files_limit
            });
        },

        performUpdate(t) {
            if (t.has("accept")) {
                this.input.accept = this.props.accept || "*/*";
            }
        },

        requestUpdate(t, b) {
            // console.log("Requesting update for property:", t, b);
        },

        _updateFilesList() {

            try {
                const totalBytes = Array.from(this.files).reduce((sum, file) => sum + file.size, 0);
                this.set({
                    filesData: this._filesData,
                    state: {
                        idle: this.files.length === 0,
                        ready: this.files.length > 0,
                        uploading: false,
                        done: false
                    },
                    uploadProgress: {
                        totalBytes: totalBytes,
                        uploadedBytes: 0,
                        percent: 0,
                        fileProgress: Array.from(this.files).map(file => ({
                            fileName: file.name,
                            progress: 0,
                            status: 'pending'
                        }))
                    }
                });
            } catch (error) {
                console.error("Error updating files list:", error);
                this.errorHandler("An error occurred while updating files list");
            }
        },

        destroy() {
            this.xhr.removeEventListener("abort", this.abortHandler),
                this.xhr.removeEventListener("error", this.errorHandler),
                this.xhr.removeEventListener("timeout", this.timeoutHandler),
                this.xhr.removeEventListener("load", this.loadHandler),
                this.xhr.upload.removeEventListener("progress", this.progressHandler),
                this.$node.removeEventListener("dragover", this.dragoverHandler),
                this.$node.removeEventListener("drop", this.dropHandler),
                this.$node.removeEventListener("click", this.clickHandler),
                this.input.removeEventListener("change", this.changeHandler),
                this.xhr = null,
                this.input = null
        },

        validate: function (files, context) {
            // This function validates multiple files and returns true or false

            return new Promise((resolve, reject) => {
                const valElement = document.getElementById(`${context.props.id}-val-msg`);
                let validationMessages = [];
                const fileSizeLimit = context.props.file_size_limit;
                const totalSizeLimit = context.props.total_size_limit; // Get total size limit
                const totalFilesLimit = context.props.total_files_limit; // Get total files limit
                const validFiles = [];

                // Helper function to update validation message
                function updateValidationMessage(messages) {
                    if (valElement) {
                        if (messages.length > 0) {
                            valElement.innerText = messages.join('\n\n');
                            valElement.style.color = "red";
                            valElement.style.display = "block";
                        } else {
                            valElement.innerText = "";
                            valElement.style.display = "none";
                        }
                    } else {
                        console.warn("Validation message element not found");
                    }
                }

                // Helper function to validate MIME type
                function validateMimeType(file, context) {
                    const acceptTypes = context.props.accept.split(/\s*,\s*/g);
                    for (const type of acceptTypes) {
                        if (type.charAt(0) === ".") {
                            if (file.name.match(new RegExp("\\" + type + "$", "i"))) return "";
                        } else if (/(audio|video|image)\/\*/i.test(type)) {
                            if (file.type.match(new RegExp("^" + type.replace(/\*/g, ".*") + "$", "i"))) return "";
                        } else if (file.type.toLowerCase() === type.toLowerCase()) {
                            return "";
                        }
                    }
                    return context.props.accept_val_msg + ` for ${file.name}`;
                }

                // Helper function to read file as text
                function readFileAsText(file) {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = () => reject(reader.error);
                        reader.readAsText(file);
                    });
                }

                // Helper function to validate CSV content
                async function validateCsvFile(file) {
                    try {
                        const content = await readFileAsText(file);
                        const rows = content.trim().split('\n').map(row => row.trim());
                        const numRows = rows.length - 1; // Subtract header

                        if (content.length === 0) {
                            return { valid: false, message: `File ${file.name}: CSV file is empty.` };
                        }
                        if (numRows < 1) {
                            return { valid: false, message: `File ${file.name}: ${context.props.csv_no_records_val_msg}` };
                        }
                        if (numRows > context.props.csv_row_limit) {
                            return { valid: false, message: `File ${file.name}: ${context.props.csv_limit_val_msg}` };
                        }

                        const headers = rows[0].split(',');
                        if (headers.length === 0) {
                            return { valid: false, message: `File ${file.name}: CSV file is missing a header row.` };
                        }

                        const headerLength = headers.length;
                        let invalidRecordMessages = [];
                        let jsonData = [];

                        for (let i = 1; i < rows.length; i++) {
                            if (rows[i].length === 0) {
                                invalidRecordMessages.push(`File ${file.name}: Empty row found on line ${i + 1}`);
                                break;
                            }

                            const data = rows[i].split(',');
                            const quotesCount = (rows[i].match(/"/g) || []).length;
                            if (quotesCount % 2 !== 0) {
                                invalidRecordMessages.push(`File ${file.name}: Mismatched quotes on line ${i + 1}`);
                            }
                            if (data.length !== headerLength) {
                                invalidRecordMessages.push(`File ${file.name}: Invalid Record Length: columns length is ${headerLength}, got ${data.length} on line ${i + 1}`);
                            }
                            if (/[^\x00-\x7F]+/.test(rows[i])) {
                                invalidRecordMessages.push(`File ${file.name}: Invalid characters found on line ${i + 1}`);
                            }

                            let entry = {};
                            for (let j = 0; j < headers.length; j++) {
                                entry[headers[j]] = data[j];
                            }

                            // Schema validation
                            let invalidRecords = {};
                            if (typeof val_csv_schema !== 'undefined' && val_csv_schema?.headers) {
                                val_csv_schema.headers.forEach((headerConfig, index) => {
                                    try {
                                        const value = entry[headerConfig.name];
                                        const isConditionMet = headerConfig.condition ? headerConfig.condition(entry) : true;
                                        if (headerConfig.required && isConditionMet && (!value || value.trim() === '')) {
                                            const errorMessage = headerConfig.requiredError(headerConfig.name, i + 1, index + 1);
                                            if (!invalidRecords[i + 1]) invalidRecords[i + 1] = [];
                                            invalidRecords[i + 1].push(`C${index + 1} [${errorMessage}]`);
                                        }
                                        if (value && headerConfig.validate && !headerConfig.validate(value)) {
                                            const errorMessage = headerConfig.validateError(headerConfig.name, i + 1, index + 1);
                                            if (!invalidRecords[i + 1]) invalidRecords[i + 1] = [];
                                            invalidRecords[i + 1].push(`C${index + 1} [${errorMessage}]`);
                                        }
                                        if (value && headerConfig.dependentValidate && !headerConfig.dependentValidate(value, entry)) {
                                            const errorMessage = headerConfig.validateError(headerConfig.name, i + 1, index + 1);
                                            if (!invalidRecords[i + 1]) invalidRecords[i + 1] = [];
                                            invalidRecords[i + 1].push(`C${index + 1} [${errorMessage}]`);
                                        }
                                    } catch (validationError) {
                                        console.error("Schema validation error:", validationError);
                                        if (!invalidRecords[i + 1]) invalidRecords[i + 1] = [];
                                        invalidRecords[i + 1].push(`C${index + 1} [Validation function error]`);
                                    }
                                });
                            }

                            Object.keys(invalidRecords).forEach(rowNumber => {
                                invalidRecordMessages.push(`File ${file.name}: Row ${rowNumber}: ${invalidRecords[rowNumber].join(', ')}`);
                            });
                            jsonData.push(entry);
                        }

                        if (invalidRecordMessages.length > 0) {
                            return { valid: false, message: invalidRecordMessages.join('\n\n') };
                        }

                        return { valid: true, data: null };
                    } catch (error) {
                        console.error(`Error reading CSV file ${file.name}:`, error);
                        return { valid: false, message: `File ${file.name}: Error reading CSV file.` };
                    }
                }

                if (totalFilesLimit && files.length > totalFilesLimit) {
                    validationMessages.push(`You can upload a maximum of ${totalFilesLimit} files. Please remove additional files to proceed.`);
                    updateValidationMessage(validationMessages);
                    context.set({
                        data: null,
                        state: {
                            idle: !0,
                            ready: !1,
                            uploading: !1,
                            done: !1
                        },
                        uploadProgress: {
                            position: 0,
                            total: 0,
                            percent: 0
                        },
                        lastError: {
                            status: 0,
                            message: validationMessages.join('\n\n'),
                            response: null
                        }
                    });
                    return resolve(false);

                }

                async function getFileSHA256(file, chunkSize = 1024 * 1024) {
                    try {
                        let hash = null;
                        let offset = 0;

                        while (offset < file.size) {
                            const slice = file.slice(offset, offset + chunkSize);
                            const chunk = await slice.arrayBuffer();
                            if (hash === null) {
                                hash = await crypto.subtle.digest('SHA-256', chunk);
                            } else {
                                const combined = new Uint8Array(hash.byteLength + chunk.byteLength);
                                combined.set(new Uint8Array(hash), 0);
                                combined.set(new Uint8Array(chunk), hash.byteLength);
                                hash = await crypto.subtle.digest('SHA-256', combined);
                            }
                            offset += chunkSize;
                        }

                        const hashArray = Array.from(new Uint8Array(hash));
                        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    } catch (error) {
                        console.error('Client-side SHA-256 chunked error:', error);
                        throw error;
                    }
                }

                // Initial client-side validation (file size and MIME type)
                async function initialValidation() {

                    let totalSize = 0;
                    for (const file of Array.from(files)) {
                        let validationMessage = "";

                        // Check MIME type
                        if (context.props.accept) {
                            validationMessage = validateMimeType(file, context);
                            if (validationMessage) {
                                validationMessages.push(validationMessage);
                                continue;
                            }
                        }

                        // Check file size
                        if (file.size > fileSizeLimit) {
                            validationMessages.push(`File ${file.name} exceeds the maximum allowed size of ${(fileSizeLimit / (1024 * 1024)).toFixed(2)} MB.`);
                            continue;
                        }

                        totalSize += file.size;

                        validFiles.push(file);
                    }

                    // If no valid files after initial checks, return false
                    if (validFiles.length === 0 || validationMessages.length > 0) {
                        context.set({
                            data: null,
                            state: {
                                idle: !0,
                                ready: !1,
                                uploading: !1,
                                done: !1
                            },
                            uploadProgress: {
                                position: 0,
                                total: 0,
                                percent: 0
                            },
                            lastError: {
                                status: 0,
                                message: validationMessages.join('\n\n'),
                                response: null
                            }
                        });

                        if (validFiles.length > 0) {
                            context.files = validFiles;
                        }
                        // Update validation messages
                        updateValidationMessage(validationMessages);
                        return resolve(false);
                    }

                    // Check total size
                    // const totalSizeStart = performance.now();

                    if (totalSize > totalSizeLimit) {
                        validationMessages.push(`Total size exceeds the limit of ${(totalSizeLimit / (1024 * 1024)).toFixed(2)}MB.`);
                        updateValidationMessage(validationMessages);
                        context.set({
                            data: null,
                            state: {
                                idle: !0,
                                ready: !1,
                                uploading: !1,
                                done: !1
                            },
                            uploadProgress: {
                                position: 0,
                                total: 0,
                                percent: 0
                            },
                            lastError: {
                                status: 0,
                                message: validationMessages.join('\n\n'),
                                response: null
                            }
                        });
                        return resolve(false);
                    }


                    // If no server-side validation is required, proceed directly to CSV validation (if any)
                    if (!context.props.val_url) {
                        const csvResults = await Promise.all(validFiles.map(file =>
                            file.type.toLowerCase() === 'text/csv' ? validateCsvFile(file) : { valid: true, data: null } // Pass null for non-CSV data
                        ));

                        const csvValidationMessages = csvResults.filter(result => !result.valid).map(result => result.message);

                        if (csvValidationMessages.length > 0) {
                            validationMessages.push(...csvValidationMessages);
                            context.set({
                                data: null,
                                state: {
                                    idle: !0,
                                    ready: !1,
                                    uploading: !1,
                                    done: !1
                                },
                                uploadProgress: {
                                    position: 0,
                                    total: 0,
                                    percent: 0
                                },
                                lastError: {
                                    status: 0,
                                    message: validationMessages.join('\n\n'),
                                    response: null
                                }
                            });
                            updateValidationMessage(validationMessages);
                            return resolve(false);
                        }

                        updateValidationMessage([]);
                        return resolve(true);
                    }

                    // Server-side validation

                    const xhr = new XMLHttpRequest();
                    const formData = new FormData();
                    validFiles.forEach((file, index) => {
                        formData.append(`${context.props.input_name}`, file);
                    });
                    context.props.val_api_params?.forEach(param => {
                        formData.append(param.key, param.value);
                    });

                    xhr.onabort = context.abortHandler;
                    xhr.onerror = context.errorHandler;
                    xhr.open("POST", context.props.val_url);
                    xhr.onload = async function () {
                        const xhrValidFiles = [];

                        let response = xhr.responseText;
                        let parsedResponse = null;

                        try {
                            parsedResponse = JSON.parse(response);
                        } catch (e) {
                            console.error("Failed to parse validation response:", e);
                            parsedResponse = null;
                        }

                        context.set({
                            valApiResp: {
                                status: xhr.status,
                                message: response,
                                response: parsedResponse
                            }
                        });

                        if (xhr.status < 200 || xhr.status >= 300) {
                            context.set({
                                data: null,
                                state: {
                                    idle: !0,
                                    ready: !1,
                                    uploading: !1,
                                    done: !1
                                },
                                uploadProgress: {
                                    position: 0,
                                    total: 0,
                                    percent: 0
                                },
                                lastError: {
                                    status: xhr.status,
                                    message: response,
                                    response: parsedResponse
                                }
                            });
                            dmx.nextTick(function () {
                                const message = context.props.val_resp_msg.replace(/^"(.*)"$/, '$1');
                                updateValidationMessage([message]);
                                if (xhr.status === 400) {
                                    this.dispatchEvent("invalid");
                                } else {
                                    this.dispatchEvent("error");
                                }
                            }, context);
                            return resolve(false);
                        }


                        if (!parsedResponse.hasOwnProperty('validatedFiles')) {
                            console.error("Invalid response structure:", parsedResponse);
                            updateValidationMessage(["Invalid response structure from validation API. Response should contain 'validatedFiles'."]);
                            dmx.nextTick(function () {
                                this.dispatchEvent("error");
                                this.set({
                                    data: null,
                                    state: {
                                        idle: !0,
                                        ready: !1,
                                        uploading: !1,
                                        done: !1
                                    },
                                    uploadProgress: {
                                        position: 0,
                                        total: 0,
                                        percent: 0
                                    },
                                    lastError: {
                                        status: 0,
                                        message: validationMessages.join('\n\n'),
                                        response: null
                                    }
                                });
                            }, context);
                            return resolve(false);
                        } else {
                            for (const file of validFiles) {
                                let sha = await getFileSHA256(file);
                                const matchedFile = parsedResponse.validatedFiles.find(file => file.fileData.sha256 === sha);

                                if (!matchedFile) {
                                    console.error(`File ${file.name} not found in server response.`);
                                    validationMessages.push(`File ${file.name} not found in server response.`);
                                } else {
                                    if (!matchedFile.is_valid) {
                                        validationMessages.push(matchedFile.message || `File ${matchedFile.fileData.name} is invalid.`);
                                    } else {
                                        xhrValidFiles.push(file);
                                        context.files.push(file);
                                    }
                                }
                                // return;
                            }

                            if (validationMessages.length > 0) {
                                dmx.nextTick(function () {
                                    this.set({
                                        data: null,
                                        state: {
                                            idle: !0,
                                            ready: !1,
                                            uploading: !1,
                                            done: !1
                                        },
                                        uploadProgress: {
                                            position: 0,
                                            total: 0,
                                            percent: 0
                                        },
                                        lastError: {
                                            status: 0,
                                            message: validationMessages.join('\n\n'),
                                            response: null
                                        }
                                    });
                                }, context);
                                // Update validation messages
                                updateValidationMessage(validationMessages);
                                return resolve(false);
                            }

                        }

                        const csvResults = await Promise.all(xhrValidFiles.map(file =>
                            file.type.toLowerCase() === 'text/csv' ? validateCsvFile(file) : { valid: true, data: null } // Pass null for non-CSV data
                        ));

                        const csvValidationMessages = csvResults.filter(result => !result.valid).map(result => result.message);

                        if (csvValidationMessages.length > 0) {
                            validationMessages.push(...csvValidationMessages);
                            updateValidationMessage(validationMessages);
                            context.set({
                                data: null,
                                state: {
                                    idle: !0,
                                    ready: !1,
                                    uploading: !1,
                                    done: !1
                                },
                                uploadProgress: {
                                    position: 0,
                                    total: 0,
                                    percent: 0
                                },
                                lastError: {
                                    status: 0,
                                    message: validationMessages.join('\n\n'),
                                    response: null
                                }
                            });
                            return resolve(false);
                        }

                        updateValidationMessage([]);
                        resolve(true);
                    };

                    xhr.send(formData);
                }

                // Start validation process
                initialValidation();
            });
        },

        updateFiles: async function (fileList) {
            fileList = [...fileList, ...this.files];
            this.files = [];
            const seen = new Set();
            fileList = fileList.filter(file => {
                const identifier = `${file.name}:${file.size}:${file.lastModified}`;
                if (seen.has(identifier)) {
                    return false; // Skip duplicate
                }
                seen.add(identifier);
                return true; // Keep first occurrence
            });

            const isValid = await this.validate(fileList, this);


            if (!isValid) {
                // Clear any existing files on validation failure
                this.set(
                    "filesData", []
                );
            } else {
                this.set(
                    {
                        lastError: {
                            status: 0,
                            message: "",
                            response: null
                        }
                    }
                )
            }

            const filesArray = Array.from(this.files);
            const files = await Promise.all(
                filesArray.map(async (file) => {
                    const dataUrl = await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(file);
                    });
                    return {
                        name: file.name,
                        size: file.size.toFixed(),
                        type: file.type,
                        dataUrl: dataUrl
                    };
                })
            );

            if (this.props.autoupload) {
                this._uploadFiles();
            }
            this._filesData = files;
            this.set(
                "filesData", files
            );
            this.set({
                state: {
                    idle: !isValid,
                    ready: isValid,
                    uploading: !1,
                    done: !1
                }
            });
            dmx.nextTick(function () {
                this.dispatchEvent('updated');
            }, this);
            return;
        },
        _reset() {
            this.files = [];
            this.set({
                data: null,
                filesData: [],
                dataUrl: null,
                valApiResp: {
                    status: 0,
                    message: "",
                    response: null
                },
                state: {
                    idle: !0,
                    ready: !1,
                    uploading: !1,
                    done: !1
                },
                uploadProgress: {
                    position: 0,
                    total: 0,
                    percent: 0
                },
                lastError: {
                    status: 0,
                    message: "",
                    response: null
                }
            })
            this._showError("");
            this.input.value = "";
        },
        abort: function () {
            this.xhr.abort()
        },

        _showError(message) {
            const errorEl = document.getElementById(`${this.props.id}-val-msg`);
            if (errorEl) {
                if (message) {
                    errorEl.textContent = message;
                    errorEl.style.color = "red";
                    errorEl.style.display = "block";
                } else {
                    errorEl.textContent = "";
                    errorEl.style.display = "none";
                }
            }
        },

        dragoverHandler(event) {
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = "copy";
        },

        dropHandler(event) {
            event.preventDefault();
            event.stopPropagation();

            if (event.dataTransfer.files.length > 0) {
                const files = Array.from(event.dataTransfer.files);
                this.updateFiles(files);
            }
        },

        clickHandler(t) {
            this.input.click()
        },

        changeHandler(t) {
            this.updateFiles(t.target.files);
        },

        _uploadFiles() {

            if (!this.props.url) {
                this._handleError("No url attribute is set");
                return;
            }

            if (!this.files || this.files.length === 0) {
                this._handleError("No files selected");
                return;
            }

            const totalBytes = Array.from(this.files).reduce((sum, file) => sum + file.size, 0);
            this.set({
                state: {
                    idle: !1,
                    ready: !1,
                    uploading: !0,
                    done: !1
                },
                uploadProgress: {
                    totalBytes: totalBytes,
                    uploadedBytes: 0,
                    percent: 0,
                    fileProgress: Array.from(this.files).map(file => ({
                        fileName: file.name,
                        progress: 0,
                        status: 'uploading'
                    }))
                }
            });

            this.dispatchEvent("start");

            try {
                const formData = new FormData();

                // Append all files using unique keys with index
                Array.from(this.files).forEach((file) => {
                    formData.append(`${this.props.input_name}`, file);
                });

                // Add required metadata
                if (this.props.include_file_data_upload) {
                    formData.append("input_name", this.props.input_name);
                }

                if (this.props.api_params) {
                    this.props.api_params.forEach(function (param) {
                        formData.append(param.key, param.value);
                    });
                }

                this.xhr = new XMLHttpRequest();

                // Setup event handlers
                this.xhr.addEventListener("abort", this.abortHandler);
                this.xhr.addEventListener("error", this.errorHandler);
                this.xhr.addEventListener("timeout", this.errorHandler);
                this.xhr.addEventListener("load", this.loadHandler);
                this.xhr.upload.addEventListener("progress", this.progressHandler);

                this.xhr.open("POST", this.props.url);
                this.xhr.send(formData);

            } catch (error) {
                this.errorHandler(error);
            }
        },

        loadHandler(event) {

            if (this.xhr.status >= 400) {
                this.errorHandler(this.xhr);
            } else {
                try {
                    const responseData = JSON.parse(this.xhr.responseText);
                    const totalBytes = Array.from(this.files).reduce((sum, file) => sum + file.size, 0);
                    this.set({
                        state: {
                            idle: !1,
                            ready: !1,
                            uploading: !1,
                            done: !0
                        },
                        uploadProgress: {
                            totalBytes: totalBytes,
                            uploadedBytes: totalBytes,
                            percent: 100,
                            fileProgress: Array.from(this.files).map(file => ({
                                fileName: file.name,
                                progress: 100,
                                status: 'complete'
                            }))
                        },
                        data: responseData
                    });
                    this.dispatchEvent("success");
                    this.dispatchEvent("done");
                } catch (parseError) {
                    console.error("Error parsing upload response:", parseError);
                    this.errorHandler("Invalid response format from server");
                }
            }
        },

        progressHandler(event) {
            if (event.lengthComputable) {
                const percent = Math.ceil(event.loaded / event.total * 100);
                this.set({
                    state: {
                        idle: !1,
                        ready: !1,
                        uploading: !0,
                        done: !1
                    },
                    uploadProgress: {
                        totalBytes: event.total,
                        uploadedBytes: event.loaded,
                        percent: percent,
                        fileProgress: Array.from(this.files).map(file => ({
                            fileName: file.name,
                            progress: percent,
                            status: 'uploading'
                        }))
                    }
                });
                this.dispatchEvent("upload", {
                    lengthComputable: event.lengthComputable,
                    loaded: event.loaded,
                    total: event.total
                });
            }
        },

        abortHandler(event) {
            this.set({
                data: null,
                state: {
                    idle: !1,
                    ready: !0,
                    uploading: !1,
                    done: !1
                },
                uploadProgress: {
                    position: 0,
                    total: 0,
                    percent: 0
                }
            }), this.dispatchEvent("abort"),
                this.dispatchEvent("done")
        },
        timeoutHandler(t) {
            this.errorHandler("Execution timeout")
        },
        errorHandler(t) {
            this.set({
                data: null,
                dataUrl: null,
                state: {
                    idle: !0,
                    ready: !1,
                    uploading: !1,
                    done: !1
                },
                uploadProgress: {
                    position: 0,
                    total: 0,
                    percent: 0
                },
                lastError: {
                    status: t.status,
                    message: "",
                    response: t.responseText ? JSON.parse(t.responseText) : t
                }
            });
            this.dispatchEvent("error")
            if (t.status === 400) {
                jsonResponse = JSON.parse(t.responseText);
                valElement.innerText = jsonResponse.data.file;
                valElement.style.color = "red";
                valElement.style.display = "block";
            }
            this.dispatchEvent("done")
            return
        },

        _handleError(message) {
            this.set({
                state: {
                    idle: !0,
                    ready: !1,
                    uploading: !1,
                    done: !1
                },
                uploadProgress: {
                    totalBytes: totalBytes,
                    uploadedBytes: 0,
                    percent: 0,
                    fileProgress: Array.from(this.files).map(file => ({
                        fileName: file.name,
                        progress: 0,
                        status: 'error'
                    }))
                },
                lastError: {
                    status: this.xhr?.status || 0,
                    message: this.xhr?.statusText || message || "Upload failed",
                    response: null
                }
            });
            this._showError(message || "Upload failed. Please try again.");
            this.dispatchEvent("error");
            this.dispatchEvent("done");
        }
    });
