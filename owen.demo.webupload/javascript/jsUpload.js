/*! jsUploader 1.1. */

/**
 * 
 * Version: 1.1.1.20151130_beta
 * Version: 1.1.2.20151201_beta  Desc: Compatible with IE8 & IE9.
 * Version: 1.1.2.20151202_beta  Desc: Compatible with IE8 & IE9.
 */
(function ($) {
    var _totalFilesSize = 0,
        _uploadedFilesSize = 0,
        _totalFilesCount = 0,
        _uploadedFilesCount = 0,

        _lblTotalSize = "total_size",
        _lblUploadedSize = "all_uploaded_size",
        _lblTotalCount = "total_count";

    var hostUrl = "";

    initWebUpload = function (options) {
        if (!WebUploader.Uploader.support()) {
            if (window.console) {
                window.console.log("sorry, your browser can't support this upload function.");
            }
            return;
        }

        var customization = $.extend({}, options);

        var uploader = WebUploader.create(customization);

        uploader.on('fileQueued', function (file) {
            var $list = $("#filelist");
            var fileSize = WebUploader.Base.formatSize(file.size);

            $list.append('<tr id="' + file.id + '">' +
                            '<td cltag="File Name">' + file.name + '</td>' +
							'<td cltag="File Size">' + fileSize + '</td>' +
                            '<td cltag="Progress">' +
                                  '<div class="progress progress-striped active">' +
                                    '<div class="progress-bar"  role="progressbar" style="width: 0%;"></div>' +
                                 '</div>' +
                            '</td>' +
                            '<td cltag="Status" class="state">Pending</td>' +
                            '<td cltag="Handle"><img class="deleteArea" src="' + hostUrl + 'Images/delete.png" /></td>' +
                         '</tr>');


            $('#' + file.id).on('click', '.deleteArea', function () {
                fileSizeDisplay('removeOneFile', file);
            });

            fileSizeDisplay('fileQueued', file);
            //设置新入队列文件列表的样式
            extendsSet("td", options);
        });

        //文件扩展名，文件大小过滤提示
        uploader.on('filesQueued', function (file) {
            if (filtered_extension.length > 0 && filtered_single_size) {
                prompt('Q_TYPE_DENIED_AND_F_EXCEED_SIZE', filtered_extension.join(','));
            }
            else if (filtered_extension.length > 0) {
                prompt('Q_TYPE_DENIED', filtered_extension.join(','));
                filtered_extension.length = 0;
            }
            else if (filtered_single_size) {
                prompt('F_EXCEED_SIZE');
                filtered_total_size = false;
            }
            filtered_num = 0;
        });
        //文件http传输之前处理相关参数：1.生成文件唯一标识guid; 2.获取需要传递的业务参数
        uploader.on('uploadBeforeSend', function (block, data) {
            if (block) {
                var $fileblock = $('#' + block.file.id);
                $fileblock.data('chunks', block.chunks || 1);

                if ('' == data.guid) {
                    var $guid = $fileblock.data("guid");

                    if (typeof ($guid) == 'undefined') {
                        $fileblock.data("guid", WebUploader.Base.guid());
                        data.guid = $fileblock.data("guid");
                    }
                    else {
                        data.guid = $guid;
                    }
                }

                //get business param data
                if (typeof (options.params) != 'undefined') {
                    var p;
                    for (p in options.params) {
                        if ("$" === options.params[p].charAt(0)) {                            
                            //data[p] = eval(options.params[p]);
							var calculate = new Function('return ' + options.params[p]);
							data[p] = calculate();
                        }
                    }
                }

            }
        });

        //更新上传进度条，以及实时显示文件上传大小
        uploader.on('uploadProgress', function (file, percentage) {
            var $li = $('#' + file.id),
                $percent = $li.find('.progress .progress-bar');

            if ($percent.length > 0) {
                $li.find('td.state').text('uploading');
                $percent.css('width', percentage * 100 + '%').text((percentage * 100).toFixed(2) + '%');
                $('#' + file.id).data('uploaded', percentage * file.size);

                uploadedSize();
            }
        });
        //上传成功(HTTP传输成功)操作
        uploader.on('uploadSuccess', function (file, response) {
            var $file = $('#' + file.id);
            var chunks = $file.data("chunks");
            var guid = $file.data("guid");
            //1. 上传不成功，删除已经存在的分片文件
            if ('200' != response) {
                if (chunks > 1) {
                    var paramDefaults = { action: 'deltempfile', chunks: chunks, guid: guid };
                    $.ajax({
                        url: options.server + "?rnd=" + Math.random(),
                        dataType: 'text',
                        data: paramDefaults,
                        success: function (data) {
                        }
                    });
                }
                prompt('UPLOAD_ERROR', file);
                return;
            }

            //2. 上传成功，合并分片文件
            if (chunks > 1) {
                var paramDefaults = { action: 'mergefile', id: file.id, chunks: chunks, name: file.name, size: file.size, guid: guid, type: file.type };
                var n;
                for (n in options.params) {
                    if ("$" === options.params[n].charAt(0)) {
                        //paramDefaults[n] = eval(options.params[n]);
						var calculate = new Function('return ' + options.params[n]);
						paramDefaults[n] = calculate();
                    }
                    else {
                        paramDefaults[n] = options.params[n];
                    }
                }

                $.ajax({
                    url: options.server + "?rnd=" + Math.random(),
                    dataType: 'text',
                    data: paramDefaults,
                    success: function (data) {
                        $file.removeData("chunks");
                        $file.removeData("guid");

                        if ("200" == data) {
                            prompt('UPLOAD_SUCCESS', file);
                        }
                        else {
                            prompt('UPLOAD_ERROR', file);
                        }
                    },
                    error: function (msg) {
                        prompt('UPLOAD_ERROR', file);
                    }
                });
            }
            else {
                prompt('UPLOAD_SUCCESS', file);
            }
        });
        //上传结束后，调用自定义的事件
        uploader.on('uploadFinished', function () {
            var isTrueFinished = true;
            $(uploader.getFiles()).each(function () {
                if ('inited' === this.getStatus()) {
                    isTrueFinished = false;
                }
            });

            if (!isTrueFinished) {
                uploader.upload();
            }
            else {
                setTimeout(finshedEvent, 2000);
            }
        });

        //上传错误处理 HTTP传输不成功
        uploader.on('uploadError', function (file, reason) {
            var $file = $('#' + file.id);
            var chunks = $file.data("chunks");
            var guid = $file.data("guid");

            // http error.  delete saved-tempfile.
            if (chunks > 1) {
                var paramDefaults = { action: 'deltempfile', chunks: chunks, guid: guid };
                $.ajax({
                    url: options.server + "?rnd=" + Math.random(),
                    dataType: 'text',
                    data: paramDefaults,
                    success: function (data) {
                    }
                });
            }
            prompt('UPLOAD_ERROR', file);
        });

        //错误类别事件
        uploader.on('error', function (errorType, file) {
            if ('Q_TYPE_DENIED' == errorType) {
                filtered_extension.indexOf(file.ext) == -1 ? filtered_extension.push(file.ext) : filtered_extension;
                filtered_num++;
            }
            else if ('F_EXCEED_SIZE' == errorType) {
                filtered_single_size = true;
                filtered_num++;
            }
            else//Q_EXCEED_NUM_LIMIT
            {
                prompt(errorType, file);
            }
        });

        //开始上传
        $("#btnUpload").on("click", function () {
            if (_totalFilesCount) {
                if (typeof isReadyToUpload == "function") {
                    var obj = isReadyToUpload();
                    if (obj.isReady == "0") {
                        alert(obj.msg);
                        return;
                    }
                }
                uploader.upload();
            }
        });

        $("#btnRemoveAll").on("click", function () {
            removeAllFiles();
        });

        //删除队列中的所有文件
        var removeAllFiles = function () {
            $(uploader.getFiles()).each(function () {
                delFlie(this);
            });

            fileSizeDisplay('removeAllFiles');
        }

        //上传结束事件
        var finshedEvent = function () {
            if (_uploadedFilesCount) {
                alert("Success! " + _uploadedFilesCount + " file(s) uploaded."); //uploader.getStats().queueNum --> inaccurate
                _uploadedFilesCount = 0;
                $("#btnRemoveAll").click();
//				if (typeof customization.finishEvent != 'undefined')
//				{
//					eval(customization.finishEvent);
//				}
				if (typeof window[customization.finishEvent] === 'function')
				{
					window[customization.finishEvent]();
				}
            }
        }

        //提示信息
        var prompt = function (promptAction, file) {
            var promptActions = {
                'F_EXCEED_SIZE': function () {
                    alert('Single file size limit is ' + WebUploader.Base.formatSize(customization.fileSingleSizeLimit) + '. ' + filtered_num + ' file(s) limited.');
                },
                'Q_TYPE_DENIED': function (file) {
                    alert('Not allow upload file type: ' + file + '. ' + filtered_num + ' file(s) limited.');
                },
                'Q_TYPE_DENIED_AND_F_EXCEED_SIZE': function (file) {
                    alert('Not allow upload file type: ' + file + ', And single file size limit is ' + WebUploader.Base.formatSize(customization.fileSingleSizeLimit) + '. ' + filtered_num + ' file(s) limited.');
                },
                'Q_EXCEED_NUM_LIMIT': function () {
                    alert('Allow upload ' + customization.fileNumLimit + ' files one time.');
                },
                'Q_EXCEED_SIZE_LIMIT': function () {
                    alert('Total file size limit is ' + WebUploader.Base.formatSize(customization.fileSizeLimit) + '.');
                },
                'UPLOAD_ERROR': function (file) {
                    $('#' + file.id).find('td.state').text('upload failed');
                    $('#' + file.id).find('.progress .progress-bar').css('width', '1');
                    $('#' + file.id).addClass("danger");
                },
                'UPLOAD_SUCCESS': function (file) {
                    var $file = $('#' + file.id);
                    $file.find('td.state').text('Completed');
                    $file.addClass("success");

                    _uploadedFilesCount += 1;
                    $file.find('td img').attr("src", hostUrl + "Images/answer.png").removeClass('deleteArea');

                    $file.off("click", "**");
                }
            };

            if (typeof promptActions[promptAction] !== 'function') {
                return;
            }
            return promptActions[promptAction](file);
        }
        //文件大小展示方法
        var fileSizeDisplay = function (action, file) {
            var actions = {
                'removeOneFile': function (file) {
                    delFlie(file);
                    uploadedSize();

                    _totalFilesCount -= 1;
                    _totalFilesSize > 0 ? _totalFilesSize -= file.size : 0;
                    $("#" + _lblTotalCount).text(_totalFilesCount);
                    $("#" + _lblTotalSize).text(WebUploader.Base.formatSize(_totalFilesSize));
                },
                'fileQueued': function (file) {
                    _totalFilesCount += 1;
                    _totalFilesSize += file.size;
                    $("#" + _lblTotalCount).text(_totalFilesCount);
                    $("#" + _lblTotalSize).text(WebUploader.Base.formatSize(_totalFilesSize));

                    $('#' + file.id).data('uploaded', 0);
                },
                'removeAllFiles': function () {
                    _totalFilesSize = 0;
                    _uploadedFilesSize = 0;
                    _totalFilesCount = 0;
                    _uploadedFilesCount = 0;
                    $('#' + _lblTotalCount).text("0");
                    $('#' + _lblUploadedSize).text("0B");
                    $('#' + _lblTotalSize).text("0B");
                }
            };
            if (typeof actions[action] !== 'function') {
                return;
            }
            return actions[action](file);
        }
        //删除文件
        var delFlie = function (file) {
            if (file.blocks) {
                var chunks = $('#' + file.id).data("chunks");
                var guid = $('#' + file.id).data("guid");
                var paramDefaults = { action: 'deltempfile', chunks: chunks, guid: guid };

                var i;
                for (i in file.blocks) {
                    if (file.blocks[i].isCount === 1) {
                        _uploadedFilesSize -= file.blocks[i].end - file.blocks[i].start;
                    }
                }
                $('#' + _lblUploadedSize).text(WebUploader.Base.formatSize(_uploadedFilesSize));

                $.ajax({
                    url: options.server + "?rnd=" + Math.random(),
                    dataType: 'text',
                    data: paramDefaults,
                    success: function (data) {
                    }
                });
            }

            uploader.removeFile(file, true);
            $('#' + file.id).remove();

            $(".uploadtablestriped tr:nth-child(n)").css("background", ""); //for IE8
            $(".uploadtablestriped tr:nth-child(odd)").css("background", "#f9f9f9"); //for IE8
        }

        var uploadedSize = function () {
            _uploadedFilesSize = 0;
            $(uploader.getFiles()).each(function () {
                _uploadedFilesSize += $('#' + this.id).data('uploaded') || 0;
            });
            $("#" + _lblUploadedSize).text(WebUploader.Base.formatSize(_uploadedFilesSize));
        }
    }


    //初始化上传区域DOM
    var EmlentInit = function (options) {
        options.containerHight = options.containerHight == 'auto' ? 'auto' : (options.containerHight.replace('px', '') - 110) + 'px';

        var uploadHtml = "<div class='uploadcontent' style='width:" + options.containerWidth + "'>" +
        "<div id='dragArea' style='width:100%;height:" + options.containerHight + ";overflow:auto;overflow-x:hidden;'>" +
            "<table class='uploadtable uploadtablestriped'>" +
                "<thead>" +
                    "<tr>" +
                        "<th style='width: 37%' cltag='File Name'>File Name</th>" +
						"<th style='width: 10%' cltag='File Size'>File Size</th>" +
                        "<th style='width: 40%' cltag='Progress'>Progress</th>" +
                        "<th style='width: 10%' cltag='Status'>Status</th>" +
                        "<th style='width: 3%' cltag='Handle'></th>" +
                    "</tr>" +
                "</thead>" +
                "<tbody id='filelist'>" +
                "</tbody>" +
            "</table>" +
        "</div>" +

        "<table id='containerFooter' class='uploadtable' style='border:0'>" +
            "<tr>" +
                "<td style='text-align:right;padding-right:30px;border:0'>" +
                    "Total: <label id='" + _lblTotalCount + "'>0</label>" +
                "</td>" +
                "<td style='width:20%;text-align:center;border:0'>" +
                    "<label id='" + _lblUploadedSize + "'>0B</label> of " +
                    "<label id='" + _lblTotalSize + "'>0B</label>" +
                "</td>" +
            "</tr>" +
        "</table>" +

        "<div>" +
            "<a id='picker' class=''>Add New Files</a>  " +
            "<a type='button' id='btnUpload' class='webuploader-button'>Upload Files</a> " +
		//"<a type='button' id='btnPause' class='webuploader-button'>Pause Upload</a> " +
            "<a type='button' id='btnRemoveAll' class='webuploader-button'>Remove All Files</a> " +
        "</div></div>";

        return uploadHtml;
    }

    //column, footer, style setting
    var extendsSet = function (tag, extendsObj) {
        for (var o in extendsObj.columns) {

            if ('0' == extendsObj.columns[o].charAt(0)) {
                $("" + tag + "[cltag='" + o + "']").hide();
            }
            else {
                $("" + tag + "[cltag='" + o + "']").css("width", extendsObj.columns[o]);
            }

        }

        if (!extendsObj.showFooter) {
            $("#containerFooter").hide();
        }

        $(".uploadtablestriped tr:nth-child(odd)").css("background", "#f9f9f9"); //for IE8
        $(".uploadtablestriped tr:nth-child(n)").each(function () {
            $(this).hover(function () {
                $(this).css("background", "#fffce4");
            }, function () {
                $(".uploadtablestriped tr:nth-child(n)").css("background", "");
                $(".uploadtablestriped tr:nth-child(odd)").css("background", "#f9f9f9");
            }
			);
        });
    }

    $.fn.infoshareUpload = function (options) {
        var i;
        for (i in options.params) {
            $.fn.infoshareUpload.defaults.formData[i] = options.params[i];
        }

        var settings = $.extend({}, $.fn.infoshareUpload.defaults, options);

        if (settings.dragable) {
            settings.dnd = "#dragArea";
            delete settings.dragable;
        }

        hostUrl = options.hostUrl;

        return this.each(function () {
            var elem = $(this);

            elem.html(EmlentInit(settings));
            extendsSet("th", settings);

            initWebUpload(settings);
        });
    }

    $.fn.infoshareUpload.defaults = {
        swf: '../Upload/webuploader/Uploader.swf',
        server: '',
        pick: '#picker',
        formData: { action: 'upload', guid: '' },
        chunked: true,
        chunkSize: 5242880, //5M
        chunkRetry: 2,
        threads: 3,
        fileNumLimit: 10,
        fileSizeLimit: 102400000,
        fileSingleSizeLimit: 512000000,
        accept: {
            title: '',
            extensions: '',
            mimeTypes: ''
        },
        disableWidgets: undefined, // {String, Array}  forbidden widget 
        // not compressed image. the default is that if file type is .jpeg, the file will be compressed before the upload.
        resize: false,
        compress: false, //if not 'false', the picture will be compressed.
        runtimeOrder: 'html5,flash',
        sendAsBinary: false,

        //extends defaults start
        containerWidth: 'auto',
        containerHight: 'auto',
        columns: {
            'File Name': '37%',
            'Progress': '37%',
            'File Size': '10%',
            'Status': '13%',
            'Handle': "3%"
        },
        finishEvent: undefined,
        dragable: false,
        showFooter: true
        //extends defaults  end
    };

})(jQuery);