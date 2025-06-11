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
                if (context.props.accept) {
                    validationMessage = validateMimeType(t, context);
                    if (validationMessage !== "") {
                        context.set({
                            data: null,
                            state: {
                                idle: true,
                                ready: false,
                                uploading: false,
                                done: false
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
                                            idle: true,
                                            ready: false,
                                            uploading: false,
                                            done: false
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
                                        idle: true,
                                        ready: false,
                                        uploading: false,
                                        done: false
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
                this.input.type = "file"
        }
    });
