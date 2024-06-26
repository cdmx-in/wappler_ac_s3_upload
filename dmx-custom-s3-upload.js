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
        val_api_params: {
            type: Array,
            default: []
        },
        sign_api_params: {
            type: Array,
            default: []
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
    onDragover: function (t) {
        t.stopPropagation(), t.preventDefault(), t.dataTransfer.dropEffect = 1 == t.dataTransfer.items.length ? "copy" : "none"
    },
    onDrop: function (t) {
        t.stopPropagation(), t.preventDefault(), 1 == t.dataTransfer.files.length && this.updateFile(t.dataTransfer.files[0])
    },
    onClick: function (t) {
        this.input.click()
    },
    onChange: function (t) {
        this.updateFile(t.target.files[0]), this.input.value = "", this.input.type = "", this.input.type = "file"
    },
    onAbort: function (t) {
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
        }), this.dispatchEvent("abort"), this.dispatchEvent("done")
    },
    onError: function (t) {
        t instanceof ProgressEvent && (t = "Network error, perhaps no CORS set"), this.set({
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
            },
            lastError: {
                status: 0,
                message: t,
                response: null
            }
        }), console.error(t), this.dispatchEvent("error"), this.dispatchEvent("done")
    },
    onTimeout: function (t) {
        this.onError("Execution timeout")
    },
    onLoad: function (t) {
        this.xhr.status >= 400 ? this.onError(this.xhr.responseText) : (this.set({
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
            }
        }), this.dispatchEvent("success"), this.dispatchEvent("done"))
    },
    onProgress: function (t) {
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
    validate: function (t, context) {
        var valElement = document.getElementById(`${this.$node.id}-val-msg`);
        var validationMessage = "";
        var jsonData = [];
        let xhr = new XMLHttpRequest;
        let formData = new FormData();
        dmx.nextTick(function () {
            formData.append('name', context.file.name);
            formData.append('file', context.file);
            // Append additional parameters from this.props.val_api_params to formData
            this.props.val_api_params.forEach(function(param) {
                formData.append(param.key, param.value);
            });
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
                  return;
              }
              var rows = content.split('\n').map(row => row.trim());
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
                  });
                  updateValidationMessage(validationMessage);
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
                  return;
              }
              let headerLength = headers.length;
              let invalidRecordMessage = '';
              let jsonData = [];
              for (let i = 1; i < rows.length; i++) {
                  if (rows[i].length > 0) {
                      let data = rows[i].split(',');
                      // Check for mismatched quotes
                      let quotesCount = (rows[i].match(/"/g) || []).length;
                      if (quotesCount % 2 !== 0) {
                          invalidRecordMessage = `Mismatched quotes on line ${i + 1}`;
                          break;
                      }
                      // Check for invalid record length
                      if (data.length !== headerLength) {
                          invalidRecordMessage = `Invalid Record Length: columns length is ${headerLength}, got ${data.length} on line ${i + 1}`;
                          break;
                      }
                      // Check for invalid characters
                      if (/[^\x00-\x7F]+/.test(rows[i])) {
                          invalidRecordMessage = `Invalid characters found on line ${i + 1}`;
                          break;
                      }
                      let entry = {};
                      for (let j = 0; j < headers.length; j++) {
                          entry[headers[j]] = data[j];
                      }
                      jsonData.push(entry);
                  } else {
                      invalidRecordMessage = `Empty row found on line ${i + 1}`;
                      break;
                  }
              }
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
              } else {
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
    updateFile: function (t) {
        if (this.validate(t, this)) {
            var e = {
                name: t.name,
                size: t.size,
                type: t.type,
                date: (t.lastModified ? new Date(t.lastModified) : t.lastModifiedDate).toISOString(),
                dataUrl: null
            }; - 1 === t.type.indexOf("image/") || t.reader || (t.reader = new FileReader, t.reader.onload = function (t) {
                e.dataUrl = t.target.result, dmx.requestUpdate()
            }.bind(this), t.reader.readAsDataURL(t)), this.file = t, this.set({
                file: e,
                state: {
                    idle: !1,
                    ready: !0,
                    uploading: !1,
                    done: !1
                }
            })
        }
    },
    abort: function () {
        this.xhr.abort()
    },
    reset: function () {
        this.abort(), this.file = null, this.set({
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
        })
    },
    upload: function () {
        if (this.props.url) {
            this.set({
                state: {
                    idle: !1,
                    ready: !1,
                    uploading: !0,
                    done: !1
                }
            }), this.dispatchEvent("start");
            var t = new XMLHttpRequest;
            t.onabort = this.onAbort.bind(this);
            t.onerror = this.onError.bind(this);
            t.open("POST", this.props.url);
                t.onload = function () {
                    let jsonResponse;
                    try {
                        jsonResponse = JSON.parse(t.responseText);
                    } catch (error) {
                        console.error("Failed to parse JSON response:", error);
                    }
                    var valElement = document.getElementById(`${this.$node.id}-val-msg`);
                    if (t.status === 200) {
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
                        return;
                        }
                    } else {
                        console.error("Failed to sign request. Status code: " + t.status);
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
                        if (t.status === 400) {
                            jsonResponse = JSON.parse(t.responseText);
                            valElement.innerText = jsonResponse.data.file;
                            valElement.style.color = "red";
                            valElement.style.display = "block";
                        }
                        return
                    }
                }.bind(this);
            t.setRequestHeader("Content-Type", "application/json");
            var requestBody = {
                name: this.file.name
            };
            this.props.sign_api_params.forEach(function(param) {
                requestBody[param.key] = param.value;
            });
            t.send(JSON.stringify(requestBody));
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