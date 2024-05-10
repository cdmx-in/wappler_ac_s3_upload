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
        lastError: {
            status: 0,
            message: "",
            response: null
        }
    },
    attributes: {
        url: {
            type: String,
            default: null
        },
        val_url: {
            type: String,
            default: null
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
    },
    methods: {
        abort: function () {
            this.abort()
        },
        reset: function () {
            this.reset()
        },
        select: function () {
            this.input.click()
        },
        upload: function () {
            this.upload()
        }
    },

    events: {
        start: Event,
        done: Event,
        error: Event,
        abort: Event,
        success: Event,
        upload: ProgressEvent
    },
    render: function (node) {
        if (this.$node) {
            this.$parse();
        }
    },
    render: function (t) {
        this.$node.addEventListener("dragover", this.onDragover.bind(this)),
            this.$node.addEventListener("drop", this.onDrop.bind(this)),
            this.$node.addEventListener("click", this.onClick.bind(this)),
            this.input = document.createElement("input"),
            this.input.type = "file",
            this.input.accept = this.props.accept || "*/*",
            this.input.addEventListener("change",
                this.onChange.bind(this)),
            this.xhr = new XMLHttpRequest,
            this.xhr.addEventListener("abort",
                this.onAbort.bind(this)),
            this.xhr.addEventListener("error",
                this.onError.bind(this)),
            this.xhr.addEventListener("timeout",
                this.onTimeout.bind(this)),
            this.xhr.addEventListener("load",
                this.onLoad.bind(this)),
            this.xhr.upload.addEventListener("progress", this.onProgress.bind(this)),
            this.$parse()
    },
    update: function (t) {
        this.props.accept != t.accept && (this.input.accept = this.props.accept || "*/*")
        // if(this.props.accept != t.accept) {
        //     this.updateFile(t)
        // }
    },
    onDragover(t) {
        t.stopPropagation(), t.preventDefault(), t.dataTransfer.dropEffect = "copy"
    },
    onDrop(t) {
        if (t.stopPropagation(), t.preventDefault(), t.dataTransfer) {
            var e = t.dataTransfer.files;
            if (e.length) {
                var i = t.dataTransfer.items;
                i && i.length && i[0].webkitGetAsEntry ? this.updateFilesFromItems(i) : this.updateFiles(e)
            }
        }
    },
    onClick: function (t) {
        this.input.click()
    },
    onChange: function (t) {
        this.updateFile(t.target.files[0]), this.input.value = "", this.input.type = "", this.input.type = "file"
    },
    onAbort(t, e) {
        t.info.uploading = !1, t.info.uploaded = 0, t.info.percent = 0, this.updateData(), this.isUploading() || (this.dispatchEvent("abort"), this.dispatchEvent("done"))
    },
    onError(t, e) {
        t.url && t.retries ? setTimeout(this.upload3.bind(this, t), 
        this.nextRetry(t.retries--)) : (e = e instanceof ProgressEvent ? "Network error, perhaps no CORS set" : e.message || e, this.set("lastError", e), 
        t.info.uploading = !1, t.info.uploaded = 0, 
        t.info.percent = 0, t.info.error = e, 
        this.updateData(), this.isUploading() || (this.dispatchEvent("error"), this.dispatchEvent("done")))
    },
    onTimeout: function (t) {
        this.onError("Execution timeout")
    },
    onLoad(t, e) {
        t.xhr.status >= 500 || 429 == t.xhr.status ? t.retries ? setTimeout(this.upload3.bind(this, t), 
        this.nextRetry(t.retries--)) : this.onError(t, t.xhr.responseText || t.xhr.statusText) : t.xhr.status >= 400 ? this.onError(t, t.xhr.responseText || t.xhr.statusText) : (this.remove(t.file.id), 
        this.updateData(), this.isUploading() || (this.uploads.length ? this.dispatchEvent("error") : this.dispatchEvent("success"), this.dispatchEvent("done")))
    },
    onProgress(t, e) {
        t.info.uploaded = e.loaded, t.info.percent = e.lengthComputable ? Math.ceil(e.loaded / e.total * 100) : 0, this.updateData()
    },
    resize(t, e) {
        var i = document.createElement("img"),
            s = parseInt(this.props["thumb-width"]) || 100,
            r = parseInt(this.props["thumb-height"]) || 100;
        i.onload = function () {
            var t = document.createElement("canvas"),
                a = t.getContext("2d"),
                n = i.width,
                o = i.height;
            s = Math.min(s, n), r = Math.min(r, o);
            var d = s / r;
            (n > s || o > r) && (n / o > d ? n = o * d : o = n / d), t.width = s, t.height = r;
            var l = (i.width - n) / 2,
                h = (i.height - o) / 2;
            a.drawImage(i, l, h, n, o, 0, 0, s, r), e(t.toDataURL())
        }, i.src = t
    },
    validate: function (t, context) {
        var valElement = document.getElementById(`${this.$node.id}-val-msg`);
        var validationMessage = "";
        var jsonData = [];
        let xhr = new XMLHttpRequest;
        let formData = new FormData();
        dmx.nextTick(function () {
            formData.append('name', context.file.name);
            formData.append('file', context.file);
            xhr.onabort = context.onAbort.bind(context);
            xhr.onerror = context.onError.bind(context);
            xhr.open("POST", context.props.val_url);
            xhr.onload = function () {
                let response = xhr.responseText;
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
                            response: JSON.parse(response)
                        }
                    })
                    dmx.nextTick(function () {
                        this.dispatchEvent("error");
                        validationMessage = context.props.val_resp_msg.replace(/^"(.*)"$/, '$1');
                        updateValidationMessage(validationMessage);
                    }, context);
                    return false;
                }
                else {
                    context.props.autoupload && context.upload()
                }
            };
            xhr.send(formData);
        }, this);

        if (t.type.toLowerCase() === 'text/csv') {
            var reader = new FileReader();
            reader.onload = function (event) {
                var rows = event.target.result.split('\n');
                var numRows = rows.length - 1; // Subtract header
                if (numRows < 2) {
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
                    })
                    updateValidationMessage(validationMessage);
                } else if (numRows > context.props.csv_row_limit) {
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
                    })
                    dmx.nextTick(function () {
                        updateValidationMessage(validationMessage);
                    }, context);
                } else {
                    let headers = rows[0].split(',');
                    for (let i = 1; i < rows.length; i++) {
                        if (rows[i].length > 0) {
                            let data = rows[i].split(',');
                            let entry = {};
                            for (let j = 0; j < headers.length; j++) {
                                entry[headers[j]] = data[j];
                            }
                            jsonData.push(entry);
                        }
                    }
                    context.set({
                        data: {
                            output: jsonData
                        }
                    });
                    updateValidationMessage();
                }
            };
            reader.readAsText(t);
        } else {
            if (context.props.accept) {
                validationMessage = validateMimeType(t, context);
            }
            updateValidationMessage(validationMessage);
        }

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
            if (message) {
                valElement.innerText = message;
                valElement.style.color = "red";
                valElement.style.display = "block";
            } else {
                valElement.innerText = "";
                valElement.style.display = "none";
            }
        }
        return !validationMessage;
    },
    updateData() {
        this.set("files", [...this.data.files]), this.uploads.length ? this.isUploading() ? this.set("state", {
            idle: !1,
            ready: !1,
            uploading: !0
        }) : this.set("state", {
            idle: !1,
            ready: !0,
            uploading: !1
        }) : this.set("state", {
            idle: !0,
            ready: !1,
            uploading: !1
        })
    },
    updateFile: function (t) {
        if (this.validate(t)) {
            t.id = ++this.ii;
            var e = {
                id: t.id,
                name: t.name,
                size: t.size,
                type: t.type,
                date: (t.lastModified ? new Date(t.lastModified) : t.lastModifiedDate).toISOString(),
                data: null,
                uploading: !1,
                uploaded: 0,
                percent: 0,
                ready: !1,
                error: null,
                dataUrl: null
            }; - 1 === t.type.indexOf("image/") || t.reader ? e.ready = !0 : (t.reader = new FileReader, t.reader.onload = t => {
                e.dataUrl = t.target.result, this.props.thumbs ? this.resize(e.dataUrl, (function (t) {
                    e.dataUrl = t, e.ready = !0, this.set("files", [...this.data.files])
                })) : e.ready = !0, this._updateData()
            }, t.reader.readAsDataURL(t));
            var i = {
                retries: this.maxRetries,
                info: e,
                file: t,
                xhr: null
            };
            this.uploads.push(i), this.set({
                files: this.data.files.concat([e]),
                state: {
                    idle: !1,
                    ready: !0,
                    uploading: !1,
                    done: !1
                }
            }), this.props.autoupload && (this.isUploading() || this.dispatchEvent("start"), this.upload(i))
        }
    },
    updateFilesFromItems(t) {
        dmx.array(t).forEach((function (t) {
            var e;
            t.webkitGetAsEntry && (e = t.webkitGetAsEntry()) ? e.isFile ? this.updateFile(t.getAsFile()) : e.isDirectory && this.updateFilesFromDirectory(e) : t.getAsFile && (t.kind && "file" != t.kind || this.updateFile(t.getAsFile()))
        }), this)
    },
    updateFilesFromDirectory(t, e) {
        var i = t.createReader(),
            s = function () {
                i.readEntries(function (t) {
                    t.length && t.forEach((function (t) {
                        t.isFile ? t.file(function (t) {
                            t.fullPath = e + "/" + t.name, this.updateFile(t)
                        }.bind(this)) : t.isDirectory && this.updateFilesFromDirectory(t, e + "/" + t.name)
                    }), this), s()
                }.bind(this), function (t) {
                    console.warn(t)
                }.bind(this))
            }.bind(this);
        s()
    },
    abort: function () {
        this.xhr.abort()
    },
    reset() {
        this.abort(), this.uploads = [], this.set({
            data: null,
            files: [],
            state: {
                idle: !0,
                ready: !1,
                uploading: !1
            },
            lastError: ""
        })
    },
    remove(t) {
        var e = this.uploads.findIndex((function (e) {
            return e.file.id == t
        })); - 1 != e && (this.uploads[e].xhr && this.uploads[e].xhr.abort(), this.uploads.splice(e, 1), this.data.files.splice(e, 1), this._updateData())
    },
    startUpload() {
        this.dispatchEvent("start"), this.uploads.forEach((function (t) {
            this.upload(t)
        }), this)
    },
    upload(t) {
        t.info && t.info.uploading || (this.props.url ? (this.set({
            state: {
                idle: !1,
                ready: !1,
                uploading: !0,
                done: !1
            }
        }), t.info.uploading = !0, this.set("files", [...this.data.files]),
            t.xhr = new XMLHttpRequest,
            t.xhr.onabort = this.onAbort.bind(this, t),
            t.xhr.onerror = this.onError.bind(this, t),
            t.xhr.ontimeout = this.onTimeout.bind(this, t),
            t.xhr.open("GET", this.props.url + "?name=" + encodeURIComponent(this.file.name)),
                t.xhr.onload = function () {
                    let jsonResponse;
                    try {
                        jsonResponse = JSON.parse(t.responseText);
                    } catch (error) {
                        console.error("Failed to parse JSON response:", error);
                    }
                    var valElement = document.getElementById(`${this.$node.id}-val-msg`);
                    if (t.xhr.status === 200) {
                        valElement.style.display = "none";
                        try {
                            jsonResponse = JSON.parse(t.responseText);
                        } catch (error) {
                            console.error("Failed to parse JSON response:", error);
                            this.set({
                                state: {
                                    idle: !0,
                                    ready: !1,
                                    uploading: !1,
                                    done: !1
                                }
                            });
                            return;
                        }
                        if (jsonResponse && jsonResponse.url) {
                            this.upload2(t);
                        } else {
                            console.error("Response URL parameter missing.");
                            this.set({
                                state: {
                                    idle: !0,
                                    ready: !1,
                                    uploading: !1,
                                    done: !1
                                }
                            });
                            return
                        }
                    } else {
                        console.error("Failed to sign request. Status code: " + t.xhr.status);
                        this.set({
                            state: {
                                idle: !0,
                                ready: !1,
                                uploading: !1,
                                done: !1
                            },
                            lastError: {
                                status: t.status,
                                message: "",
                                response: jsonResponse
                            }
                        });
                        this.dispatchEvent("error")
                        if (t.xhr.status === 400) {
                            jsonResponse = JSON.parse(t.responseText);
                            valElement.innerText = jsonResponse.data.file;
                            valElement.style.color = "red";
                            valElement.style.display = "block";
                        }
                        return
                    }
                }.bind(this)
            t.xhr.send();
        } else this.onError("No url attribute is set")
    },
    upload2: function (t) {
        try {
            var e = JSON.parse(t.responseText),
                i = e[this.props.prop];
            if (this.set("data", e), this.xhr.open("PUT", i), this.xhr.setRequestHeader("Content-Type", this.file.type), -1 != i.indexOf("x-amz-acl=")) {
                var s = i.substr(i.indexOf("x-amz-acl=") + 10); - 1 != s.indexOf("&") && (s = s.substr(0, s.indexOf("&"))), this.xhr.setRequestHeader("x-amz-acl", s)
            }
            this.xhr.send(this.file)
        } catch (t) {
            this.onError(t)
        }
    }
});